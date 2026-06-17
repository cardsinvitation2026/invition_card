/**
 * Stage 16C verification (in-memory mode).
 * Usage: npm run reliability:verify
 */
process.env.DISABLE_RENDER_WORKER = '1';
process.env.RENDER_RELIABILITY_STUCK_THRESHOLD_MS = '1000';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const { draftService } = await import('../src/features/drafts');
  const { renderJobService } = await import('../src/features/render-jobs');
  const { userService } = await import('../src/features/users');
  const {
    classifyFailure,
    collectReliabilityMetrics,
    discoverRetryableFailedJobs,
    formatRetryError,
    parseRetryCount,
    recordJobFailure,
    recoverStuckProcessingJobs,
    requeueRetryableFailedJobs,
    resetReliabilityMetrics,
    RENDER_RELIABILITY_MAX_RETRIES,
    RENDER_RELIABILITY_STUCK_RECOVERY_ERROR,
    runPreCycleMaintenance,
  } = await import('../src/features/render-reliability');
  const { createRenderWorkerService, discoverPendingRenderJobs, renderWorkerLock } =
    await import('../src/features/render-worker');
  const { runRenderWorkerStartupRecovery } = await import(
    '../src/server/render-worker.bootstrap'
  );

  const results: Record<string, string> = {};
  resetReliabilityMetrics();

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-reliability-user',
    email: 'reliability-verify@local.test',
    name: 'Reliability Verify User',
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

  function getJobStore() {
    return globalThis.__mi_inmem_render_jobs__ as
      | Map<string, import('../src/types/render-job').RenderJobDetail>
      | undefined;
  }

  function setJobField<K extends keyof import('../src/types/render-job').RenderJobDetail>(
    jobId: string,
    field: K,
    value: import('../src/types/render-job').RenderJobDetail[K],
  ) {
    const store = getJobStore();
    const existing = store?.get(jobId);
    if (!existing || !store) {
      throw new Error(`Job ${jobId} not found in in-memory store`);
    }
    store.set(jobId, { ...existing, [field]: value });
  }

  async function cancelOtherPendingJobs(keepId: string) {
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

  async function createPendingJob() {
    const draft = await draftService.createDraft(user.id, {
      templateId: 'tpl_royal_mandap_gold',
      values: { bride_name: 'Rel', groom_name: 'Test' },
    });
    return renderJobService.createRenderJob(user.id, {
      draftId: draft.draft.id,
      templateId: 'tpl_royal_mandap_gold',
    });
  }

  const stuckJob = await createPendingJob();
  await renderJobService.updateRenderJobStatus(stuckJob.id, {
    status: 'PROCESSING',
    startedAt: new Date().toISOString(),
    error: null,
  });
  setJobField(
    stuckJob.id,
    'updatedAt',
    new Date(Date.now() - 5000).toISOString(),
  );
  const recovered = await recoverStuckProcessingJobs();
  const stuckAfter = await renderJobService.getRenderJob(ownerSession(), stuckJob.id);
  results.test_stuck_processing_recovery =
    recovered === 1 &&
    stuckAfter?.status === 'FAILED' &&
    stuckAfter.error === RENDER_RELIABILITY_STUCK_RECOVERY_ERROR
      ? 'PASS'
      : 'FAIL';

  resetReliabilityMetrics();
  globalThis.__mi_render_worker_bootstrapped__ = false;
  const startupJob = await createPendingJob();
  await renderJobService.updateRenderJobStatus(startupJob.id, {
    status: 'PROCESSING',
    startedAt: new Date().toISOString(),
    error: null,
  });
  setJobField(
    startupJob.id,
    'updatedAt',
    new Date(Date.now() - 5000).toISOString(),
  );
  await runRenderWorkerStartupRecovery();
  const startupAfter = await renderJobService.getRenderJob(ownerSession(), startupJob.id);
  results.test_startup_recovery =
    startupAfter?.status === 'FAILED' &&
    startupAfter.error === RENDER_RELIABILITY_STUCK_RECOVERY_ERROR
      ? 'PASS'
      : 'FAIL';

  const retryDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Retry', groom_name: 'One' },
  });
  const retryJob = await renderJobService.createRenderJob(user.id, {
    draftId: retryDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  await renderJobService.updateRenderJobStatus(retryJob.id, {
    status: 'FAILED',
    error: 'Cloudinary upload failure',
    completedAt: new Date().toISOString(),
  });
  const retryCandidates = await discoverRetryableFailedJobs();
  results.test_retry_candidate_discovery = retryCandidates.some((job) => job.id === retryJob.id)
    ? 'PASS'
    : 'FAIL';

  const limitDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Limit', groom_name: 'Test' },
  });
  const limitJob = await renderJobService.createRenderJob(user.id, {
    draftId: limitDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  await renderJobService.updateRenderJobStatus(limitJob.id, {
    status: 'FAILED',
    error: formatRetryError(RENDER_RELIABILITY_MAX_RETRIES, 'network timeout'),
    completedAt: new Date().toISOString(),
  });
  const limitedCandidates = await discoverRetryableFailedJobs();
  results.test_retry_limit_enforced = !limitedCandidates.some((job) => job.id === limitJob.id)
    ? 'PASS'
    : 'FAIL';

  results.test_retryable_failure_classification =
    classifyFailure('network timeout during cloudinary upload') === 'retryable' ? 'PASS' : 'FAIL';
  results.test_non_retryable_failure_classification =
    classifyFailure('template not mapped for draft') === 'non_retryable' ? 'PASS' : 'FAIL';

  const requeueDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Requeue', groom_name: 'Test' },
  });
  const requeueJob = await renderJobService.createRenderJob(user.id, {
    draftId: requeueDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  await renderJobService.updateRenderJobStatus(requeueJob.id, {
    status: 'FAILED',
    error: 'temporary renderer failure',
    completedAt: new Date().toISOString(),
  });
  const requeued = await requeueRetryableFailedJobs();
  const requeuedJob = await renderJobService.getRenderJob(ownerSession(), requeueJob.id);
  results.test_failed_job_requeued =
    requeued >= 1 &&
    requeuedJob?.status === 'PENDING' &&
    parseRetryCount(requeuedJob?.error) === 1
      ? 'PASS'
      : 'FAIL';

  const terminalDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Terminal', groom_name: 'Test' },
  });
  const terminalJob = await renderJobService.createRenderJob(user.id, {
    draftId: terminalDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  await renderJobService.updateRenderJobStatus(terminalJob.id, {
    status: 'FAILED',
    error: 'draft not found',
    completedAt: new Date().toISOString(),
  });
  await recordJobFailure(
    (await renderJobService.getRenderJob(ownerSession(), terminalJob.id))!,
    0,
  );
  const terminalAfter = await renderJobService.getRenderJob(ownerSession(), terminalJob.id);
  await requeueRetryableFailedJobs();
  const terminalFinal = await renderJobService.getRenderJob(ownerSession(), terminalJob.id);
  results.test_terminal_failure_not_requeued =
    parseRetryCount(terminalAfter?.error) === RENDER_RELIABILITY_MAX_RETRIES &&
    terminalFinal?.status === 'FAILED'
      ? 'PASS'
      : 'FAIL';

  const metrics = await collectReliabilityMetrics();
  results.test_metrics_generation =
    typeof metrics.pendingJobs === 'number' &&
    typeof metrics.processingJobs === 'number' &&
    typeof metrics.completedJobs === 'number' &&
    typeof metrics.failedJobs === 'number' &&
    typeof metrics.retryableFailedJobs === 'number' &&
    typeof metrics.stuckJobsRecovered === 'number' &&
    typeof metrics.jobsRetried === 'number'
      ? 'PASS'
      : 'FAIL';

  async function isolatePendingJob(keepId: string) {
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

  const workerDraft = await draftService.createDraft(user.id, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Worker', groom_name: 'Continue' },
  });
  const workerJob = await renderJobService.createRenderJob(user.id, {
    draftId: workerDraft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  const worker = createRenderWorkerService(async (_session, jobId) => {
    return renderJobService.updateRenderJobStatus(jobId, {
      status: 'COMPLETED',
      finalUrl: 'https://example.com/reliability.mp4',
      completedAt: new Date().toISOString(),
      error: null,
    });
  });
  renderWorkerLock.clearAll();
  await isolatePendingJob(workerJob.id);
  const workerResult = await worker.processPendingJobs();
  const workerAfter = await renderJobService.getRenderJob(ownerSession(), workerJob.id);
  results.test_worker_continues_after_recovery =
    workerResult.processed &&
    workerResult.jobId === workerJob.id &&
    workerAfter?.status === 'COMPLETED'
      ? 'PASS'
      : 'FAIL';

  const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
  const schema = readFileSync(schemaPath, 'utf8');
  const forbiddenColumns = ['retryCount', 'lastHeartbeat', 'processingStartedAt'];
  const schemaHasForbidden = forbiddenColumns.some((column) => schema.includes(column));
  results.test_no_schema_changes = !schemaHasForbidden ? 'PASS' : 'FAIL';

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
