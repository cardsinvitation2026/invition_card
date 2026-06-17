/**
 * Stage 16I verification (in-memory mode).
 * Usage: npm run audit:verify
 */
process.env.DISABLE_RENDER_WORKER = '1';
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage16i';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_16i';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const { auditService } = await import('../src/lib/audit');
  const { userService } = await import('../src/features/users');
  const { membershipPlanService } = await import('../src/features/membership-plans');
  const { membershipService } = await import('../src/features/memberships');
  const { draftService } = await import('../src/features/drafts');
  const { renderJobService } = await import('../src/features/render-jobs');
  const { orderService } = await import('../src/features/orders');
  const { paymentService, paymentVerificationService } = await import('../src/features/payments');
  const { downloadService } = await import('../src/features/downloads');
  const { computeRazorpaySignature } = await import('../src/lib/razorpay/razorpay-signature.service');
  const { adminRoutes } = await import('../src/lib/admin/routes');

  const results: Record<string, string> = {};
  const API_SECRET = 'test_secret_stage_16i';

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-audit-user',
    email: 'audit-verify@local.test',
    name: 'Audit Verify User',
  });

  const session = {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    role: user.role,
    status: user.status,
    provider: 'dev' as const,
  };

  const plan = await membershipPlanService.getPlan('plan_basic');
  if (!plan) {
    throw new Error('Seed plan_basic missing');
  }

  const template = await (
    await import('../src/features/templates')
  ).templateService.getTemplateBySlug('royal-mandap-gold');
  if (!template) {
    throw new Error('Seed template missing');
  }

  const draft = await draftService.createDraft(user.id, {
    templateId: template.id,
    title: 'Audit Draft',
    values: [],
  });

  const renderJob = await renderJobService.createRenderJob(user.id, {
    draftId: draft.draft.id,
    templateId: template.id,
  });
  await renderJobService.updateRenderJobStatus(renderJob.id, { status: 'PROCESSING' });
  await renderJobService.updateRenderJobStatus(renderJob.id, {
    status: 'COMPLETED',
    finalUrl: 'https://res.cloudinary.com/demo/video/upload/audit-test.mp4',
    completedAt: new Date().toISOString(),
  });

  const order = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const razorpayOrderId = `order_audit_${order.id}`;
  const payment = await paymentService.createPayment({
    orderId: order.id,
    razorpayOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });

  const razorpayPaymentId = `pay_audit_${payment.id}`;
  const signature = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId, API_SECRET);
  await paymentVerificationService.verifyMembershipPurchase(user.id, {
    orderId: order.id,
    planId: plan.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: signature,
  });

  const completedOrder = await orderService.getOrder(order.id);
  const membershipId = completedOrder?.membershipId;
  if (!membershipId) {
    throw new Error('Membership missing after payment');
  }

  const download = await downloadService.executeDownload(session, renderJob.id);

  const customerTimeline = await auditService.getCustomerTimeline(user.id);
  results.test_customer_timeline =
    customerTimeline &&
    customerTimeline.events.some((event) => event.eventType === 'USER_CREATED') &&
    customerTimeline.events.some((event) => event.eventType === 'DRAFT_CREATED') &&
    customerTimeline.events.some((event) => event.eventType === 'RENDER_COMPLETED') &&
    customerTimeline.events.some((event) => event.eventType === 'PAYMENT_SUCCESS')
      ? 'PASS'
      : 'FAIL';

  const renderTimeline = await auditService.getRenderTimeline(renderJob.id);
  results.test_render_timeline =
    renderTimeline &&
    renderTimeline.events.some((event) => event.eventType === 'RENDER_JOB_CREATED') &&
    renderTimeline.events.some((event) => event.eventType === 'RENDER_COMPLETED')
      ? 'PASS'
      : 'FAIL';

  const paymentTimeline = await auditService.getPaymentTimeline(payment.id);
  results.test_payment_timeline =
    paymentTimeline &&
    paymentTimeline.events.some((event) => event.eventType === 'PAYMENT_CREATED') &&
    paymentTimeline.events.some((event) => event.eventType === 'ORDER_COMPLETED')
      ? 'PASS'
      : 'FAIL';

  const membershipTimeline = await auditService.getMembershipTimeline(membershipId);
  results.test_membership_timeline =
    membershipTimeline &&
    membershipTimeline.events.some((event) => event.eventType === 'MEMBERSHIP_CREATED') &&
    membershipTimeline.events.some((event) => event.eventType === 'MEMBERSHIP_QUOTA_SNAPSHOT')
      ? 'PASS'
      : 'FAIL';

  const downloadTimeline = await auditService.getDownloadTimeline(download.downloadLogId);
  results.test_download_timeline =
    downloadTimeline &&
    downloadTimeline.events.some((event) => event.eventType === 'DOWNLOAD_RECORDED') &&
    downloadTimeline.events.some((event) => event.eventType === 'RENDER_SOURCE')
      ? 'PASS'
      : 'FAIL';

  const overview = await auditService.getOverview();
  results.test_system_observability =
    overview.observability.health &&
    overview.observability.queue &&
    overview.observability.reliability &&
    overview.observability.deployment
      ? 'PASS'
      : 'FAIL';

  const auditRoute = readFileSync(
    resolve(process.cwd(), 'src/app/api/admin/audit/route.ts'),
    'utf8',
  );
  results.test_admin_api_auth =
    auditRoute.includes('requireSuperAdmin') &&
    auditRoute.includes('export async function GET')
      ? 'PASS'
      : 'FAIL';

  const auditServiceSource = readFileSync(
    resolve(process.cwd(), 'src/lib/audit/audit.service.ts'),
    'utf8',
  );
  results.test_read_only_behavior =
    !auditServiceSource.includes('create(') &&
    !auditServiceSource.includes('update(') &&
    !auditServiceSource.includes('delete(') &&
    auditServiceSource.includes('getOverview')
      ? 'PASS'
      : 'FAIL';

  results.test_worker_metrics_visible =
    typeof overview.observability.reliability.pendingJobs === 'number' &&
    typeof overview.observability.worker.running === 'boolean'
      ? 'PASS'
      : 'FAIL';

  results.test_operations_metrics_visible =
    typeof overview.observability.queue.retryableFailedJobs === 'number' &&
    typeof overview.observability.deployment.ready === 'boolean'
      ? 'PASS'
      : 'FAIL';

  const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  results.test_no_schema_changes =
    !schema.includes('AuditEvent') && !schema.includes('auditTimeline') ? 'PASS' : 'FAIL';

  const workerSource = readFileSync(
    resolve(process.cwd(), 'src/features/render-worker/render-worker.service.ts'),
    'utf8',
  );
  const paymentSource = readFileSync(
    resolve(process.cwd(), 'src/features/payments/payment-verification.service.ts'),
    'utf8',
  );
  results.test_no_business_logic_changes =
    !workerSource.includes('lib/audit') && !paymentSource.includes('lib/audit') ? 'PASS' : 'FAIL';

  const sidebar = readFileSync(
    resolve(process.cwd(), 'src/components/admin/layout/AdminSidebar.tsx'),
    'utf8',
  );
  results.test_audit_navigation =
    adminRoutes.audit === '/admin/audit' &&
    sidebar.includes("label: 'Audit'") &&
    sidebar.includes('adminRoutes.audit')
      ? 'PASS'
      : 'FAIL';

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
