/**
 * Stage 16G verification (in-memory mode).
 * Usage: npm run claiming:verify
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
    discoverRetryableFailedJobs,
    formatRetryError,
    recoverStuckProcessingJobs,
    requeueRetryableFailedJobs,
    RENDER_RELIABILITY_MAX_RETRIES,
    RENDER_RELIABILITY_STUCK_RECOVERY_ERROR,
  } = await import('../src/features/render-reliability');
  const {
    createRenderWorkerService,
    discoverPendingRenderJobs,
    renderWorkerLock,
  } = await import('../src/features/render-worker');

  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-claiming-user',
    email: 'claiming-verify@local.test',
    name: 'Claiming Verify User',
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

  async function createPendingJob(suffix: string) {
    const draft = await draftService.createDraft(user.id, {
      templateId: 'tpl_royal_mandap_gold',
      values: { bride_name: suffix, groom_name: 'Claim' },
    });
    return renderJobService.createRenderJob(user.id, {
      draftId: draft.draft.id,
      templateId: 'tpl_royal_mandap_gold',
    });
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

  // test_atomic_claim_success
  {
    const job = await createPendingJob('claim_success');
    const claimed = await renderJobService.claimPendingRenderJob(job.id);
    const after = await renderJobService.getRenderJob(ownerSession(), job.id);
    results.test_atomic_claim_success =
      claimed && after?.status === 'PROCESSING' && after.startedAt ? 'PASS' : 'FAIL';
  }

  // test_atomic_claim_failure
  {
    const job = await createPendingJob('claim_fail');
    const first = await renderJobService.claimPendingRenderJob(job.id);
    const second = await renderJobService.claimPendingRenderJob(job.id);
    results.test_atomic_claim_failure = first && !second ? 'PASS' : 'FAIL';
  }

  // test_duplicate_claim_single_winner
  {
    const job = await createPendingJob('dup_claim');
    const outcomes = await Promise.all(
      Array.from({ length: 10 }, () => renderJobService.claimPendingRenderJob(job.id)),
    );
    const winners = outcomes.filter(Boolean).length;
    const after = await renderJobService.getRenderJob(ownerSession(), job.id);
    results.test_duplicate_claim_single_winner =
      winners === 1 && after?.status === 'PROCESSING' ? 'PASS' : 'FAIL';
  }

  // test_two_workers_same_job
  {
    renderWorkerLock.clearAll();
    const job = await createPendingJob('two_workers');
    await isolatePendingJob(job.id);
    let executionCount = 0;
    const worker = createRenderWorkerService(async () => {
      executionCount += 1;
      return renderJobService.updateRenderJobStatus(job.id, {
        status: 'COMPLETED',
        finalUrl: 'https://example.com/two-workers.mp4',
        completedAt: new Date().toISOString(),
        error: null,
      });
    });
    const [resultA, resultB] = await Promise.all([
      worker.processPendingJobs(),
      worker.processPendingJobs(),
    ]);
    const after = await renderJobService.getRenderJob(ownerSession(), job.id);
    const processedCount = [resultA, resultB].filter((result) => result.processed).length;
    results.test_two_workers_same_job =
      executionCount === 1 &&
      processedCount === 1 &&
      after?.status === 'COMPLETED'
        ? 'PASS'
        : `FAIL (executions=${executionCount}, processed=${processedCount}, status=${after?.status})`;
  }

  // test_claimed_job_not_reprocessed
  {
    renderWorkerLock.clearAll();
    const job = await createPendingJob('not_reprocessed');
    await renderJobService.claimPendingRenderJob(job.id);
    await isolatePendingJob(job.id);
    let executed = false;
    const worker = createRenderWorkerService(async () => {
      executed = true;
      return (await renderJobService.getRenderJob(ownerSession(), job.id))!;
    });
    const result = await worker.processPendingJobs();
    const after = await renderJobService.getRenderJob(ownerSession(), job.id);
    results.test_claimed_job_not_reprocessed =
      !executed && !result.processed && after?.status === 'PROCESSING' ? 'PASS' : 'FAIL';
  }

  // test_fifo_order_preserved
  {
    renderWorkerLock.clearAll();
    const jobA = await createPendingJob('fifo_a');
    await new Promise((resolve) => setTimeout(resolve, 5));
    const jobB = await createPendingJob('fifo_b');
    const pending = await discoverPendingRenderJobs();
    for (const job of pending) {
      if (job.id === jobA.id || job.id === jobB.id) {
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
    const discovered = await discoverPendingRenderJobs();
    const orderedIds = discovered.map((job) => job.id);
    const aIndex = orderedIds.indexOf(jobA.id);
    const bIndex = orderedIds.indexOf(jobB.id);
    results.test_fifo_order_preserved =
      aIndex >= 0 && bIndex >= 0 && aIndex < bIndex ? 'PASS' : 'FAIL';
  }

  // test_worker_continues_after_claim_failure
  {
    renderWorkerLock.clearAll();
    const claimedJob = await createPendingJob('claimed_block');
    const runnableJob = await createPendingJob('runnable');
    await renderJobService.claimPendingRenderJob(claimedJob.id);
    await isolatePendingJob(runnableJob.id);
    const processedIds: string[] = [];
    const worker = createRenderWorkerService(async (_session, jobId) => {
      processedIds.push(jobId);
      return renderJobService.updateRenderJobStatus(jobId, {
        status: 'COMPLETED',
        finalUrl: 'https://example.com/continue.mp4',
        completedAt: new Date().toISOString(),
        error: null,
      });
    });
    const result = await worker.processPendingJobs();
    results.test_worker_continues_after_claim_failure =
      result.processed &&
      result.jobId === runnableJob.id &&
      processedIds.length === 1 &&
      processedIds[0] === runnableJob.id
        ? 'PASS'
        : 'FAIL';
  }

  // test_reliability_recovery_still_works
  {
    const stuckJob = await createPendingJob('stuck_recovery');
    await renderJobService.updateRenderJobStatus(stuckJob.id, {
      status: 'PROCESSING',
      startedAt: new Date().toISOString(),
      error: null,
    });
    const store = getJobStore();
    const existing = store?.get(stuckJob.id);
    if (existing && store) {
      store.set(stuckJob.id, {
        ...existing,
        updatedAt: new Date(Date.now() - 5000).toISOString(),
      });
    }
    const recovered = await recoverStuckProcessingJobs();
    const after = await renderJobService.getRenderJob(ownerSession(), stuckJob.id);
    results.test_reliability_recovery_still_works =
      recovered === 1 &&
      after?.status === 'FAILED' &&
      after.error === RENDER_RELIABILITY_STUCK_RECOVERY_ERROR
        ? 'PASS'
        : 'FAIL';
  }

  // test_retry_engine_still_works
  {
    const retryJob = await createPendingJob('retry_engine');
    await renderJobService.updateRenderJobStatus(retryJob.id, {
      status: 'FAILED',
      error: 'Cloudinary upload failure',
      completedAt: new Date().toISOString(),
    });
    const candidates = await discoverRetryableFailedJobs();
    const requeued = await requeueRetryableFailedJobs();
    const after = await renderJobService.getRenderJob(ownerSession(), retryJob.id);
    results.test_retry_engine_still_works =
      candidates.some((job) => job.id === retryJob.id) &&
      requeued >= 1 &&
      after?.status === 'PENDING' &&
      classifyFailure('Cloudinary upload failure') === 'retryable'
        ? 'PASS'
        : 'FAIL';
  }

  // test_inmemory_parity
  {
    const job = await createPendingJob('inmem_parity');
    const claimed = await renderJobService.claimPendingRenderJob(job.id);
    const duplicate = await renderJobService.claimPendingRenderJob(job.id);
    results.test_inmemory_parity = claimed && !duplicate ? 'PASS' : 'FAIL';
  }

  // test_no_schema_changes
  {
    const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf8');
    const forbiddenColumns = ['workerId', 'lastHeartbeat', 'claimedAt', 'claimOwner'];
    const schemaHasForbidden = forbiddenColumns.some((column) => schema.includes(column));
    results.test_no_schema_changes = !schemaHasForbidden ? 'PASS' : 'FAIL';
  }

  // test_multi_instance_claim_simulation
  {
    renderWorkerLock.clearAll();
    const job = await createPendingJob('multi_instance');
    await isolatePendingJob(job.id);
    let renderAttempts = 0;
    const worker = createRenderWorkerService(async (_session, jobId) => {
      renderAttempts += 1;
      return renderJobService.updateRenderJobStatus(jobId, {
        status: 'COMPLETED',
        finalUrl: 'https://example.com/multi-instance.mp4',
        completedAt: new Date().toISOString(),
        error: null,
      });
    });
    const instances = await Promise.all(
      Array.from({ length: 4 }, () => worker.processPendingJobs()),
    );
    const winners = instances.filter((result) => result.processed && result.jobId === job.id);
    const after = await renderJobService.getRenderJob(ownerSession(), job.id);
    results.test_multi_instance_claim_simulation =
      renderAttempts === 1 &&
      winners.length === 1 &&
      after?.status === 'COMPLETED'
        ? 'PASS'
        : `FAIL (attempts=${renderAttempts}, winners=${winners.length}, status=${after?.status})`;
  }

  console.log(JSON.stringify(results, null, 2));

  const failed = Object.entries(results).filter(([, value]) => value !== 'PASS');
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
