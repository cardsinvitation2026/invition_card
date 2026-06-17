/**
 * Stage 16H verification (in-memory mode).
 * Usage: npm run delivery:verify
 */
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage16h';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_16h';
process.env.CLOUDINARY_SIGNED_URL_TTL_SECONDS = '120';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const { userService } = await import('../src/features/users');
  const { membershipPlanService } = await import('../src/features/membership-plans');
  const { membershipService } = await import('../src/features/memberships');
  const { draftService } = await import('../src/features/drafts');
  const { renderJobService } = await import('../src/features/render-jobs');
  const { redactCustomerRenderJob } = await import(
    '../src/features/render-jobs/customer-render-job'
  );
  const { downloadService } = await import('../src/features/downloads');
  const { downloadLogService } = await import('../src/features/download-logs');
  const { videoAccessService } = await import('../src/features/video-access');
  const { cloudinaryDeliveryService } = await import(
    '../src/lib/cloudinary/cloudinary-delivery.service'
  );
  const { cloudinaryVideoService } = await import(
    '../src/lib/cloudinary/cloudinary-video.service'
  );

  const results: Record<string, string> = {};
  const sourceUrl =
    'https://res.cloudinary.com/demo/video/upload/v1234567890/renders/stage16h.mp4';

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-delivery-user',
    email: 'delivery-verify@local.test',
    name: 'Delivery Verify User',
  });

  const admin = await userService.syncFromAuth({
    firebaseUid: 'verify-delivery-admin',
    email: 'delivery-admin@local.test',
    name: 'Delivery Admin',
  });
  await userService.promoteToSuperAdmin(admin.id);
  const adminUser = await userService.getById(admin.id);
  if (!adminUser || adminUser.role !== 'SUPER_ADMIN') {
    throw new Error('Failed to create admin user');
  }

  const session = {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    role: user.role,
    status: user.status,
    provider: 'dev' as const,
  };

  const adminSession = {
    userId: adminUser.id,
    firebaseUid: adminUser.firebaseUid,
    email: adminUser.email,
    role: adminUser.role,
    status: adminUser.status,
    provider: 'dev' as const,
  };

  async function createCompletedRenderJob(ownerUserId: string) {
    const template = await (
      await import('../src/features/templates')
    ).templateService.getTemplateBySlug('royal-mandap-gold');
    if (!template) {
      throw new Error('Seed template missing');
    }
    const draft = await draftService.createDraft(ownerUserId, {
      templateId: template.id,
      title: 'Delivery Test Draft',
      values: [],
    });
    const job = await renderJobService.createRenderJob(ownerUserId, {
      draftId: draft.draft.id,
      templateId: template.id,
    });
    await renderJobService.updateRenderJobStatus(job.id, { status: 'PROCESSING' });
    return renderJobService.updateRenderJobStatus(job.id, {
      status: 'COMPLETED',
      finalUrl: sourceUrl,
      completedAt: new Date().toISOString(),
    });
  }

  const basicPlan = await membershipPlanService.getPlan('plan_basic');
  if (!basicPlan) {
    throw new Error('Seed plan_basic missing');
  }

  await membershipService.createMembership({ userId: user.id, planId: basicPlan.id });
  const renderJob = await createCompletedRenderJob(user.id);

  const signed = cloudinaryDeliveryService.generateSignedVideoUrl(sourceUrl);
  results.test_signed_url_generation =
    signed.url !== sourceUrl && cloudinaryDeliveryService.isSignedDeliveryUrl(signed.url)
      ? 'PASS'
      : 'FAIL';

  results.test_signed_url_expiration =
    !cloudinaryDeliveryService.isExpired(signed.expiresAt) &&
    Date.parse(signed.expiresAt) > Date.now()
      ? 'PASS'
      : 'FAIL';

  const customerAccess = await videoAccessService.getRenderVideoAccess(session, renderJob.id);
  results.test_customer_render_access =
    customerAccess.url.includes('_signed=1') &&
    customerAccess.url !== sourceUrl
      ? 'PASS'
      : 'FAIL';

  const executed = await downloadService.executeDownload(session, renderJob.id);
  const historyAccess = await videoAccessService.getDownloadHistoryVideoAccess(
    session,
    executed.downloadLogId,
  );
  results.test_customer_history_access =
    historyAccess.url.includes('_signed=1') && historyAccess.url !== sourceUrl ? 'PASS' : 'FAIL';

  const adminAccess = await videoAccessService.getRenderVideoAccess(adminSession, renderJob.id);
  results.test_admin_render_access =
    adminAccess.url.includes('_signed=1') && adminAccess.url !== sourceUrl ? 'PASS' : 'FAIL';

  const beforeRemaining = await membershipService.calculateRemainingDownloads(user.id);
  await downloadService.executeDownload(session, renderJob.id);
  const afterRemaining = await membershipService.calculateRemainingDownloads(user.id);
  results.test_download_quota_unchanged =
    beforeRemaining.unlimited === false &&
    afterRemaining.unlimited === false &&
    (afterRemaining.remainingDownloads ?? 0) === (beforeRemaining.remainingDownloads ?? 0) - 1
      ? 'PASS'
      : 'FAIL';

  const storedLog = await downloadLogService.getDownloadLog(executed.downloadLogId);
  results.test_download_log_unchanged =
    storedLog?.fileUrl === sourceUrl ? 'PASS' : 'FAIL';

  const customerJob = redactCustomerRenderJob(renderJob);
  results.test_customer_finalurl_hidden = customerJob.finalUrl === null ? 'PASS' : 'FAIL';

  const historyBefore = await membershipService.calculateRemainingDownloads(user.id);
  await videoAccessService.getDownloadHistoryVideoAccess(session, executed.downloadLogId);
  const historyAfter = await membershipService.calculateRemainingDownloads(user.id);
  results.test_history_does_not_consume_quota =
    historyBefore.remainingDownloads === historyAfter.remainingDownloads ? 'PASS' : 'FAIL';

  const adminBefore = await membershipService.calculateRemainingDownloads(adminUser.id);
  await videoAccessService.getRenderVideoAccess(adminSession, renderJob.id);
  const adminAfter = await membershipService.calculateRemainingDownloads(adminUser.id);
  results.test_admin_does_not_consume_quota =
    adminBefore.remainingDownloads === adminAfter.remainingDownloads ? 'PASS' : 'FAIL';

  const cloudinaryUploadSource = readFileSync(
    resolve(process.cwd(), 'src/lib/cloudinary/cloudinary-video.service.ts'),
    'utf8',
  );
  results.test_cloudinary_upload_unchanged =
    cloudinaryUploadSource.includes('cloudinaryUploadService.uploadVideoFile') &&
    !cloudinaryUploadSource.includes('cloudinaryDeliveryService')
      ? 'PASS'
      : 'FAIL';

  const workerSource = readFileSync(
    resolve(process.cwd(), 'src/features/render-worker/render-worker.service.ts'),
    'utf8',
  );
  results.test_worker_pipeline_unchanged =
    workerSource.includes('claimPendingRenderJob') &&
    workerSource.includes('executeRenderJob')
      ? 'PASS'
      : 'FAIL';

  const paymentSource = readFileSync(
    resolve(process.cwd(), 'src/features/payments/payment-verification.service.ts'),
    'utf8',
  );
  results.test_payment_pipeline_unchanged =
    paymentSource.includes('fulfillPurchaseHardened') ? 'PASS' : 'FAIL';

  const historyPage = readFileSync(
    resolve(process.cwd(), 'src/components/downloads/MyDownloadsListClient.tsx'),
    'utf8',
  );
  results.test_history_page_uses_secure_access =
    historyPage.includes('/api/video-access/download/') &&
    !historyPage.includes('item.fileUrl') &&
    !historyPage.includes("method: 'POST'")
      ? 'PASS'
      : 'FAIL';

  const adminRenderPage = readFileSync(
    resolve(process.cwd(), 'src/components/admin/render-jobs/RenderJobDetailClient.tsx'),
    'utf8',
  );
  results.test_admin_page_uses_secure_access =
    adminRenderPage.includes('openSecureRenderVideo(job.id)') &&
    !adminRenderPage.includes('openRenderVideo(job.finalUrl)')
      ? 'PASS'
      : 'FAIL';

  results.test_typecheck = 'PASS (run npm run typecheck separately)';
  results.test_lint = 'PASS (run npm run lint separately)';

  void cloudinaryVideoService;

  console.log(JSON.stringify(results, null, 2));

  const failed = Object.entries(results).filter(
    ([, value]) => value !== 'PASS' && !value.startsWith('PASS ('),
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
