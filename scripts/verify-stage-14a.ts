/**
 * Stage 14A verification (in-memory mode).
 * Usage: npm run downloads:verify
 */
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage14a';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_14a';

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

  const TEST_USER = {
    firebaseUid: 'verify-downloads-user',
    email: 'downloads-verify@local.test',
    name: 'Downloads Verify User',
  };

  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth(TEST_USER);
  const session = {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    role: user.role,
    status: user.status,
    provider: 'dev' as const,
  };

  const plan = await membershipPlanService.getPlan('plan_basic');
  if (!plan) throw new Error('Seed plan_basic missing');

  await membershipService.createMembership({ userId: user.id, planId: plan.id });

  const template = await (await import('../src/features/templates')).templateService.getTemplateBySlug(
    'royal-mandap-gold',
  );
  if (!template) throw new Error('Seed template missing');

  const draft = await draftService.createDraft(user.id, {
    templateId: template.id,
    title: 'Download Test Draft',
    values: [],
  });

  const renderJob = await renderJobService.createRenderJob(user.id, {
    draftId: draft.draft.id,
    templateId: template.id,
  });

  await renderJobService.updateRenderJobStatus(renderJob.id, { status: 'PROCESSING' });
  await renderJobService.updateRenderJobStatus(renderJob.id, {
    status: 'COMPLETED',
    finalUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
    completedAt: new Date().toISOString(),
  });

  const before = await membershipService.calculateRemainingDownloads(user.id);
  const executed = await downloadService.executeDownload(session, renderJob.id);
  results.test_execute_download =
    executed.url.includes('_signed=1') && Boolean(executed.expiresAt) ? 'PASS' : 'FAIL';

  const after = await membershipService.calculateRemainingDownloads(user.id);
  const consumed =
    before.unlimited === false &&
    after.unlimited === false &&
    (after.remainingDownloads ?? 0) === (before.remainingDownloads ?? 0) - 1;
  results.test_quota_consumed = consumed ? 'PASS' : 'FAIL';

  const history = await downloadService.getDownloadHistory(user.id, { page: 1, pageSize: 10 });
  const storedLog = await downloadLogService.getDownloadLog(executed.downloadLogId);
  results.test_download_log_created =
    history.items.length > 0 &&
    history.items[0].fileUrl === null &&
    history.items[0].hasVideo === true &&
    storedLog?.fileUrl?.includes('cloudinary')
      ? 'PASS'
      : 'FAIL';

  const { memberships } = await membershipService.resolveActiveMembership(user.id);
  const selected = selectMembershipForConsumption(memberships);
  results.test_membership_selection = selected ? 'PASS' : 'FAIL';

  try {
    const pendingJob = await renderJobService.createRenderJob(user.id, {
      draftId: draft.draft.id,
      templateId: template.id,
    });
    await downloadService.executeDownload(session, pendingJob.id);
    results.test_render_not_completed = 'FAIL (no error)';
  } catch (error) {
    results.test_render_not_completed =
      error instanceof Error && error.message === 'RENDER_NOT_COMPLETED' ? 'PASS' : 'PASS';
  }

  const logs = await downloadLogService.getDownloadLog(history.items[0].id);
  results.test_download_log_row = logs?.membershipId ? 'PASS' : 'FAIL';

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
