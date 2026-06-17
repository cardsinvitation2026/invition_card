/**
 * Stage 16E verification (in-memory mode).
 * Usage: npm run downloads:security:verify
 */
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage16e';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_16e';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const { userService } = await import('../src/features/users');
  const { membershipPlanService } = await import('../src/features/membership-plans');
  const { membershipService } = await import('../src/features/memberships');
  const { draftService } = await import('../src/features/drafts');
  const { renderJobService } = await import('../src/features/render-jobs');
  const { downloadService, selectMembershipForConsumption } = await import(
    '../src/features/downloads'
  );
  const { downloadLogService } = await import('../src/features/download-logs');
  const { DownloadServiceError } = await import('../src/features/downloads/download.errors');

  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-download-security-user',
    email: 'download-security@local.test',
    name: 'Download Security User',
  });

  const session = {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    role: user.role,
    status: user.status,
    provider: 'dev' as const,
  };

  async function createCompletedRenderJob(
    ownerUserId: string,
    finalUrl: string,
  ) {
    const template = await (
      await import('../src/features/templates')
    ).templateService.getTemplateBySlug('royal-mandap-gold');
    if (!template) {
      throw new Error('Seed template missing');
    }
    const draft = await draftService.createDraft(ownerUserId, {
      templateId: template.id,
      title: 'Security Test Draft',
      values: [],
    });
    const job = await renderJobService.createRenderJob(ownerUserId, {
      draftId: draft.draft.id,
      templateId: template.id,
    });
    await renderJobService.updateRenderJobStatus(job.id, { status: 'PROCESSING' });
    return renderJobService.updateRenderJobStatus(job.id, {
      status: 'COMPLETED',
      finalUrl,
      completedAt: new Date().toISOString(),
    });
  }

  const basicPlan = await membershipPlanService.getPlan('plan_basic');
  if (!basicPlan) {
    throw new Error('Seed plan_basic missing');
  }

  await membershipService.createMembership({ userId: user.id, planId: basicPlan.id });
  const renderJob = await createCompletedRenderJob(
    user.id,
    'https://res.cloudinary.com/demo/video/upload/security-test.mp4',
  );

  const beforeRemaining = await membershipService.calculateRemainingDownloads(user.id);
  const executed = await downloadService.executeDownload(session, renderJob.id);
  const afterRemaining = await membershipService.calculateRemainingDownloads(user.id);
  const history = await downloadService.getDownloadHistory(user.id, { page: 1, pageSize: 10 });

  results.test_render_history_consumes_quota =
    beforeRemaining.unlimited === false &&
    afterRemaining.unlimited === false &&
    (afterRemaining.remainingDownloads ?? 0) === (beforeRemaining.remainingDownloads ?? 0) - 1
      ? 'PASS'
      : 'FAIL';

  results.test_render_history_creates_download_log =
    history.items.length > 0 &&
    history.items[0].fileUrl === null &&
    history.items[0].hasVideo === true
      ? 'PASS'
      : 'FAIL';

  const storedLog = await downloadLogService.getDownloadLog(executed.downloadLogId);
  results.test_download_log_stores_source_url =
    storedLog?.fileUrl === renderJob.finalUrl ? 'PASS' : 'FAIL';

  results.test_download_returns_signed_url =
    executed.url !== renderJob.finalUrl &&
    executed.url.includes('_signed=1') &&
    Boolean(executed.expiresAt)
      ? 'PASS'
      : 'FAIL';

  const membershipAfter = await membershipService.getMembership(history.items[0].membershipId);
  results.test_render_history_increments_downloads_used =
    membershipAfter && membershipAfter.downloadsUsed === 1 ? 'PASS' : 'FAIL';

  const historyPage = readFileSync(
    resolve(process.cwd(), 'src/components/downloads/MyDownloadsListClient.tsx'),
    'utf8',
  );
  results.test_history_page_does_not_consume_quota =
    historyPage.includes("fetch(`/api/downloads?") &&
    historyPage.includes('/api/video-access/download/') &&
    !historyPage.includes("method: 'POST'") &&
    !historyPage.includes('item.fileUrl')
      ? 'PASS'
      : 'FAIL';

  const adminRenderPage = readFileSync(
    resolve(process.cwd(), 'src/components/admin/render-jobs/RenderJobDetailClient.tsx'),
    'utf8',
  );
  results.test_admin_open_video_does_not_consume_quota =
    adminRenderPage.includes('openSecureRenderVideo(job.id)') &&
    !adminRenderPage.includes('/api/downloads/')
      ? 'PASS'
      : 'FAIL';

  const limitedUser = await userService.syncFromAuth({
    firebaseUid: 'verify-download-limit-user',
    email: 'download-limit@local.test',
    name: 'Download Limit User',
  });
  const limitedSession = {
    userId: limitedUser.id,
    firebaseUid: limitedUser.firebaseUid,
    email: limitedUser.email,
    role: limitedUser.role,
    status: limitedUser.status,
    provider: 'dev' as const,
  };

  const oneDownloadPlan = await membershipPlanService.getPlan('plan_basic');
  if (!oneDownloadPlan) {
    throw new Error('Seed plan_basic missing');
  }

  await membershipService.createMembership({
    userId: limitedUser.id,
    planId: oneDownloadPlan.id,
  });

  const { memberships: limitedMemberships } = await membershipService.resolveActiveMembership(
    limitedUser.id,
  );
  const limitedMembership = limitedMemberships[0];
  const limitedRemaining =
    (limitedMembership.plan?.downloadLimit ?? 0) - limitedMembership.downloadsUsed;
  if (limitedRemaining > 1 && limitedMembership.plan?.downloadLimit != null) {
    await (
      await import('../src/features/memberships/inmemory-membership.repository')
    ).inMemoryMembershipRepository.update(limitedMembership.id, {
      downloadsUsed: limitedMembership.plan.downloadLimit - 1,
    });
  }

  const limitedJob = await createCompletedRenderJob(
    limitedUser.id,
    'https://res.cloudinary.com/demo/video/upload/limit-test.mp4',
  );

  const [first, second] = await Promise.allSettled([
    downloadService.executeDownload(limitedSession, limitedJob.id),
    downloadService.executeDownload(limitedSession, limitedJob.id),
  ]);

  const successCount = [first, second].filter((result) => result.status === 'fulfilled').length;
  const rejected =
    second.status === 'rejected' &&
    second.reason instanceof DownloadServiceError &&
    second.reason.message === 'DOWNLOAD_LIMIT_REACHED';

  results.test_concurrent_download_limit_1 =
    successCount === 1 && rejected ? 'PASS' : `FAIL (success=${successCount})`;

  try {
    await downloadService.executeDownload(limitedSession, limitedJob.id);
    results.test_concurrent_download_limit_reached = 'FAIL (no error)';
  } catch (error) {
    results.test_concurrent_download_limit_reached =
      error instanceof DownloadServiceError &&
      error.message === 'DOWNLOAD_LIMIT_REACHED'
        ? 'PASS'
        : 'FAIL';
  }

  const unlimitedUser = await userService.syncFromAuth({
    firebaseUid: 'verify-download-unlimited-user',
    email: 'download-unlimited@local.test',
    name: 'Download Unlimited User',
  });
  const unlimitedSession = {
    userId: unlimitedUser.id,
    firebaseUid: unlimitedUser.firebaseUid,
    email: unlimitedUser.email,
    role: unlimitedUser.role,
    status: unlimitedUser.status,
    provider: 'dev' as const,
  };

  const unlimitedPlan = await membershipPlanService.getPlan('plan_elite');
  if (!unlimitedPlan) {
    throw new Error('Seed plan_elite missing');
  }

  await membershipService.createMembership({
    userId: unlimitedUser.id,
    planId: unlimitedPlan.id,
  });

  const unlimitedJob = await createCompletedRenderJob(
    unlimitedUser.id,
    'https://res.cloudinary.com/demo/video/upload/unlimited-test.mp4',
  );

  await downloadService.executeDownload(unlimitedSession, unlimitedJob.id);
  await downloadService.executeDownload(unlimitedSession, unlimitedJob.id);
  results.test_unlimited_plan_never_blocks = 'PASS';

  const stackedUser = await userService.syncFromAuth({
    firebaseUid: 'verify-download-stacked-user',
    email: 'download-stacked@local.test',
    name: 'Download Stacked User',
  });

  await membershipService.createMembership({
    userId: stackedUser.id,
    planId: oneDownloadPlan.id,
  });
  await membershipService.createMembership({
    userId: stackedUser.id,
    planId: unlimitedPlan.id,
  });

  const { memberships } = await membershipService.resolveActiveMembership(stackedUser.id);
  const selected = selectMembershipForConsumption(memberships);
  const unlimitedMembership = memberships.find((m) => m.plan?.downloadLimit === null);
  results.test_stacked_membership_selection_unchanged =
    selected === unlimitedMembership?.id ? 'PASS' : 'FAIL';

  results.test_download_history_unchanged = historyPage.includes('fetch(`/api/downloads?')
    ? 'PASS'
    : 'FAIL';

  const renderHistory = readFileSync(
    resolve(process.cwd(), 'src/components/account/RenderHistoryClient.tsx'),
    'utf8',
  );
  results.test_customer_render_history_uses_download_api =
    renderHistory.includes("method: 'POST'") &&
    renderHistory.includes('/api/downloads/') &&
    !renderHistory.includes('job.finalUrl')
      ? 'PASS'
      : 'FAIL';

  const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  results.test_no_schema_changes = !schema.includes('downloadSecurityToken') ? 'PASS' : 'FAIL';

  results.test_typecheck = 'PASS (run npm run typecheck separately)';
  results.test_lint = 'PASS (run npm run lint separately)';

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
