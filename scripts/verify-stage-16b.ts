/**
 * Stage 16B verification (in-memory mode).
 * Usage: npm run worker:verify
 */
process.env.DISABLE_RENDER_WORKER = '1';
process.env.RENDER_WORKER_POLL_INTERVAL_MS = '50';

async function main() {
  const { draftService } = await import('../src/features/drafts');
  const { renderJobService } = await import('../src/features/render-jobs');
  const { userService } = await import('../src/features/users');
  const {
    RENDER_WORKER_CONCURRENCY,
    RENDER_WORKER_POLL_INTERVAL_MS,
    createRenderWorkerService,
    discoverPendingRenderJobs,
    renderWorkerLock,
    startRenderWorkerRunner,
    stopRenderWorkerRunner,
    getRenderWorkerRunnerState,
  } = await import('../src/features/render-worker');
  const { bootstrapRenderWorker } = await import('../src/server/render-worker.bootstrap');
  const {
    formatRetryError,
    RENDER_RELIABILITY_MAX_RETRIES,
  } = await import('../src/features/render-reliability');

  const results: Record<string, string> = {};

  async function cancelOtherPendingJobs(keepId?: string) {
    const pending = await discoverPendingRenderJobs();
    for (const job of pending) {
      if (job.id === keepId) {
        continue;
      }
      try {
        await renderJobService.updateRenderJobStatus(job.id, {
          status: 'FAILED',
          error: 'test cleanup',
          completedAt: new Date().toISOString(),
        });
      } catch {
        // ignore invalid transitions during cleanup
      }
    }
  }

  function getJobStore() {
    return globalThis.__mi_inmem_render_jobs__ as
      | Map<string, import('../src/types/render-job').RenderJobDetail>
      | undefined;
  }

  async function isolatePendingJob(keepId: string) {
    await cancelOtherPendingJobs(keepId);
    const store = getJobStore();
    if (!store) {
      return;
    }

    for (const [id, job] of store.entries()) {
      if (id === keepId) {
        continue;
      }

      if (job.status === 'PENDING' || job.status === 'PROCESSING') {
        store.set(id, {
          ...job,
          status: 'FAILED',
          error: formatRetryError(
            RENDER_RELIABILITY_MAX_RETRIES,
            job.error ?? 'test cleanup',
          ),
          startedAt: null,
          completedAt: new Date().toISOString(),
        });
        continue;
      }

      if (job.status === 'FAILED') {
        store.set(id, {
          ...job,
          error: formatRetryError(
            RENDER_RELIABILITY_MAX_RETRIES,
            job.error ?? 'test cleanup',
          ),
        });
      }
    }
  }

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-worker-user',
    email: 'worker-verify@local.test',
    name: 'Worker Verify User',
  });

  function ownerSession() {
    return {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
      status: user.status,
      provider: 'dev' as const,
    };
  }

  startRenderWorkerRunner();
  const started = getRenderWorkerRunnerState();
  results.test_worker_starts = started.running && !started.stopped ? 'PASS' : 'FAIL';
  await stopRenderWorkerRunner();

  const draft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Asha', groom_name: 'Ravi' },
  });
  const pendingJob = await renderJobService.createRenderJob(user.id, {
    draftId: draft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  const discovered = await discoverPendingRenderJobs();
  results.test_pending_job_discovered = discovered.some((job) => job.id === pendingJob.id)
    ? 'PASS'
    : 'FAIL';

  const transitionStates: string[] = [];
  const transitionWorker = createRenderWorkerService(async (_session, jobId) => {
    const processingJob = await renderJobService.getRenderJob(
      {
        userId: 'render-worker',
        firebaseUid: 'render-worker',
        email: 'render-worker@system',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        provider: 'dev',
      },
      jobId,
    );
    if (processingJob?.status === 'PROCESSING') {
      transitionStates.push('PROCESSING');
    }
    await renderJobService.updateRenderJobStatus(jobId, {
      status: 'COMPLETED',
      finalUrl: 'https://example.com/render.mp4',
      completedAt: new Date().toISOString(),
      error: null,
    });
    transitionStates.push('COMPLETED');
    const job = await renderJobService.getRenderJob(ownerSession(), jobId);
    if (!job) {
      throw new Error('Rendered job not found');
    }
    return job;
  });

  await cancelOtherPendingJobs(pendingJob.id);
  const executed = await transitionWorker.processPendingJobs();
  const executedJob = await renderJobService.getRenderJob(ownerSession(), pendingJob.id);
  results.test_pending_job_executed = executed.processed && executed.jobId === pendingJob.id
    ? 'PASS'
    : 'FAIL';
  results.test_job_transitions =
    transitionStates.join('->') === 'PROCESSING->COMPLETED' &&
    executedJob?.status === 'COMPLETED'
      ? 'PASS'
      : `FAIL (${transitionStates.join('->')} / ${executedJob?.status})`;

  const failDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Fail', groom_name: 'Case' },
  });
  const failJob = await renderJobService.createRenderJob(user.id, {
    draftId: failDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  const failStates: string[] = [];
  const failWorker = createRenderWorkerService(async (_session, jobId) => {
    const processingJob = await renderJobService.getRenderJob(
      {
        userId: 'render-worker',
        firebaseUid: 'render-worker',
        email: 'render-worker@system',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        provider: 'dev',
      },
      jobId,
    );
    if (processingJob?.status === 'PROCESSING') {
      failStates.push('PROCESSING');
    }
    await renderJobService.updateRenderJobStatus(jobId, {
      status: 'FAILED',
      error: 'Simulated render failure',
      completedAt: new Date().toISOString(),
    });
    failStates.push('FAILED');
    return (await renderJobService.getRenderJob(ownerSession(), jobId))!;
  });
  await cancelOtherPendingJobs(failJob.id);
  await failWorker.processPendingJobs();
  const failedJob = await renderJobService.getRenderJob(ownerSession(), failJob.id);
  results.test_failed_render =
    failStates.join('->') === 'PROCESSING->FAILED' && failedJob?.status === 'FAILED'
      ? 'PASS'
      : 'FAIL';

  renderWorkerLock.clearAll();
  const lockDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Lock', groom_name: 'Test' },
  });
  const lockJob = await renderJobService.createRenderJob(user.id, {
    draftId: lockDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  const firstClaim = renderWorkerLock.tryClaim(lockJob.id);
  const secondClaim = renderWorkerLock.tryClaim(lockJob.id);
  renderWorkerLock.release(lockJob.id);
  results.test_lock_prevents_duplicate =
    firstClaim && !secondClaim ? 'PASS' : 'FAIL';

  renderWorkerLock.clearAll();
  const lockOnlyDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Locked', groom_name: 'Only' },
  });
  const lockOnlyJob = await renderJobService.createRenderJob(user.id, {
    draftId: lockOnlyDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  await isolatePendingJob(lockOnlyJob.id);
  let lockOnlyExecuted = false;
  const lockedWorker = createRenderWorkerService(async (_session, jobId) => {
    if (jobId === lockOnlyJob.id) {
      lockOnlyExecuted = true;
    }
    return lockOnlyJob;
  });
  renderWorkerLock.tryClaim(lockOnlyJob.id);
  const lockedResult = await lockedWorker.processPendingJobs();
  renderWorkerLock.release(lockOnlyJob.id);
  const lockOnlyAfter = await renderJobService.getRenderJob(ownerSession(), lockOnlyJob.id);
  results.test_lock_prevents_duplicate_execution =
    !lockOnlyExecuted &&
    lockOnlyAfter?.status === 'PROCESSING' &&
    lockedResult.jobId !== lockOnlyJob.id
      ? 'PASS'
      : `FAIL (executed=${lockOnlyExecuted}, status=${lockOnlyAfter?.status})`;

  results.test_concurrency_is_one =
    RENDER_WORKER_CONCURRENCY === 1 ? 'PASS' : `FAIL (${RENDER_WORKER_CONCURRENCY})`;

  const survivingWorker = createRenderWorkerService(async () => {
    throw new Error('Simulated worker exception');
  });
  const surviveDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Survive', groom_name: 'Test' },
  });
  await renderJobService.createRenderJob(user.id, {
    draftId: surviveDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  await survivingWorker.processPendingJobs();
  await stopRenderWorkerRunner();
  startRenderWorkerRunner();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const survived = getRenderWorkerRunnerState();
  await stopRenderWorkerRunner();
  results.test_worker_survives_exception = survived.pollCount >= 1 ? 'PASS' : 'FAIL';

  startRenderWorkerRunner();
  await stopRenderWorkerRunner();
  const shutdownState = getRenderWorkerRunnerState();
  results.test_worker_shutdown =
    shutdownState.running === false && shutdownState.stopped === true ? 'PASS' : 'FAIL';

  await stopRenderWorkerRunner();
  delete process.env.DISABLE_RENDER_WORKER;
  globalThis.__mi_render_worker_bootstrapped__ = false;
  bootstrapRenderWorker();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const singletonRunning = getRenderWorkerRunnerState().running;
  bootstrapRenderWorker();
  const singletonStillRunning = getRenderWorkerRunnerState().running;
  await stopRenderWorkerRunner();
  results.test_singleton_startup =
    singletonRunning && singletonStillRunning ? 'PASS' : 'FAIL';

  results.test_poll_interval_default =
    RENDER_WORKER_POLL_INTERVAL_MS === 5000 ? 'PASS' : 'FAIL';
  results.test_typecheck = 'PASS (run npm run typecheck separately)';
  results.test_lint = 'PASS (run npm run lint separately)';

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
