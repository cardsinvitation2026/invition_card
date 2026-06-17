import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { renderJobService } from '@/features/render-jobs';
import {
  RENDER_RELIABILITY_MAX_RETRIES,
  RENDER_RELIABILITY_RETRY_COUNT_PATTERN,
  RENDER_RELIABILITY_RETRY_COUNT_PREFIX,
  RENDER_RELIABILITY_STUCK_PROCESSING_THRESHOLD_MS,
  RENDER_RELIABILITY_STUCK_RECOVERY_ERROR,
} from '@/features/render-reliability/render-reliability.constants';
import {
  recordJobsRetried,
  recordStuckJobsRecovered,
  snapshotReliabilityMetrics,
} from '@/features/render-reliability/render-reliability.metrics';
import type {
  FailureClassification,
  RenderReliabilityJobRef,
  RenderReliabilityMetricsSnapshot,
} from '@/features/render-reliability/render-reliability.types';
import type { AuthSession } from '@/types/auth';
import type { RenderJobDetail, RenderJobStatus } from '@/types/render-job';

const WORKER_LIST_SESSION: AuthSession = {
  userId: 'render-worker',
  firebaseUid: 'render-worker',
  email: 'render-worker@system',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  provider: 'dev',
};

function resolveStuckThresholdMs(): number {
  const raw = process.env.RENDER_RELIABILITY_STUCK_THRESHOLD_MS;
  if (!raw) {
    return RENDER_RELIABILITY_STUCK_PROCESSING_THRESHOLD_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1000) {
    return RENDER_RELIABILITY_STUCK_PROCESSING_THRESHOLD_MS;
  }
  return parsed;
}

export function parseRetryCount(error: string | null | undefined): number {
  if (!error) {
    return 0;
  }
  const match = error.match(RENDER_RELIABILITY_RETRY_COUNT_PATTERN);
  if (!match) {
    return 0;
  }
  return Number.parseInt(match[1], 10);
}

export function stripRetryPrefix(error: string | null | undefined): string {
  if (!error) {
    return '';
  }
  return error.replace(RENDER_RELIABILITY_RETRY_COUNT_PATTERN, '').trim();
}

export function formatRetryError(retryCount: number, message: string): string {
  const clean = stripRetryPrefix(message) || message || 'Render failed';
  return `${RENDER_RELIABILITY_RETRY_COUNT_PREFIX}${retryCount}|${clean}`;
}

export function classifyFailure(errorMessage: string): FailureClassification {
  const message = stripRetryPrefix(errorMessage).toLowerCase();
  if (!message) {
    return 'retryable';
  }

  const nonRetryablePatterns = [
    'template not mapped',
    'draft not found',
    'invalid ownership',
    'invalid composition',
    'missing template',
    'draft template mismatch',
    'template mismatch',
    'composition not found',
    'unmapped template',
  ];

  if (nonRetryablePatterns.some((pattern) => message.includes(pattern))) {
    return 'non_retryable';
  }

  const retryablePatterns = [
    'timeout',
    'timed out',
    'cloudinary',
    'network',
    'econnreset',
    'econnrefused',
    'filesystem',
    'renderer',
    'temporary',
    'upload failure',
    'render failed',
    'abandoned processing',
  ];

  if (retryablePatterns.some((pattern) => message.includes(pattern))) {
    return 'retryable';
  }

  return 'retryable';
}

function toJobRef(job: RenderJobDetail): RenderReliabilityJobRef {
  return {
    id: job.id,
    draftId: job.draftId,
    status: job.status,
    error: job.error,
    finalUrl: job.finalUrl,
    updatedAt: job.updatedAt,
    createdAt: job.createdAt,
  };
}

async function listJobsByStatus(status: RenderJobStatus): Promise<RenderJobDetail[]> {
  const result = await renderJobService.listRenderJobs(WORKER_LIST_SESSION, {
    page: 1,
    pageSize: 100,
    status,
  });
  return result.items;
}

function isStaleProcessingJob(job: RenderReliabilityJobRef, now: Date): boolean {
  if (job.status !== 'PROCESSING') {
    return false;
  }
  const updatedAt = new Date(job.updatedAt).getTime();
  return now.getTime() - updatedAt >= resolveStuckThresholdMs();
}

async function markJobFailedFromRecovery(job: RenderReliabilityJobRef): Promise<void> {
  await renderJobService.updateRenderJobStatus(job.id, {
    status: 'FAILED',
    error: RENDER_RELIABILITY_STUCK_RECOVERY_ERROR,
    completedAt: new Date().toISOString(),
  });
}

async function requeueJobToPending(jobId: string, error: string): Promise<void> {
  const nowIso = new Date().toISOString();

  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'PENDING',
          error,
          startedAt: null,
          completedAt: null,
          updatedAt: new Date(nowIso),
        },
      });
      return;
    }
  }

  const store = globalThis.__mi_inmem_render_jobs__ as
    | Map<string, RenderJobDetail>
    | undefined;
  const existing = store?.get(jobId);
  if (!existing || !store) {
    return;
  }

  store.set(jobId, {
    ...existing,
    status: 'PENDING',
    error,
    startedAt: null,
    completedAt: null,
    updatedAt: nowIso,
  });
}

function isRetryEligible(job: RenderReliabilityJobRef): boolean {
  if (job.status !== 'FAILED') {
    return false;
  }

  const retryCount = parseRetryCount(job.error);
  if (retryCount >= RENDER_RELIABILITY_MAX_RETRIES) {
    return false;
  }

  const classification = classifyFailure(job.error ?? '');
  return classification === 'retryable';
}

export async function recoverStuckProcessingJobs(
  now: Date = new Date(),
): Promise<number> {
  const processingJobs = await listJobsByStatus('PROCESSING');
  let recovered = 0;

  for (const job of processingJobs) {
    const ref = toJobRef(job);
    if (!isStaleProcessingJob(ref, now)) {
      continue;
    }

    await markJobFailedFromRecovery(ref);
    recovered += 1;
  }

  if (recovered > 0) {
    recordStuckJobsRecovered(recovered);
  }

  return recovered;
}

export async function discoverRetryableFailedJobs(): Promise<RenderReliabilityJobRef[]> {
  const failedJobs = await listJobsByStatus('FAILED');
  return failedJobs
    .map(toJobRef)
    .filter(isRetryEligible)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function requeueRetryableFailedJobs(): Promise<number> {
  const candidates = await discoverRetryableFailedJobs();
  let requeued = 0;

  for (const job of candidates) {
    const retryCount = parseRetryCount(job.error);
    const message = stripRetryPrefix(job.error ?? '') || 'Render failed';
    const nextError =
      retryCount > 0
        ? formatRetryError(retryCount, message)
        : formatRetryError(1, message);

    await requeueJobToPending(job.id, nextError);
    requeued += 1;
  }

  if (requeued > 0) {
    recordJobsRetried(requeued);
  }

  return requeued;
}

export async function runPreCycleMaintenance(): Promise<void> {
  await recoverStuckProcessingJobs();
  await requeueRetryableFailedJobs();
}

export async function recordJobFailure(
  job: RenderJobDetail,
  priorRetryCount: number,
): Promise<void> {
  const message = stripRetryPrefix(job.error ?? '') || 'Render failed';
  const classification = classifyFailure(message);
  const nextRetryCount = priorRetryCount + 1;
  const encodedError = formatRetryError(
    classification === 'non_retryable'
      ? RENDER_RELIABILITY_MAX_RETRIES
      : Math.min(nextRetryCount, RENDER_RELIABILITY_MAX_RETRIES),
    message,
  );

  if (job.status !== 'FAILED') {
    return;
  }

  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.renderJob.update({
        where: { id: job.id },
        data: {
          error: encodedError,
          updatedAt: new Date(),
        },
      });
      return;
    }
  }

  const store = globalThis.__mi_inmem_render_jobs__ as
    | Map<string, RenderJobDetail>
    | undefined;
  const existing = store?.get(job.id);
  if (!existing || !store) {
    return;
  }

  store.set(job.id, {
    ...existing,
    error: encodedError,
    updatedAt: new Date().toISOString(),
  });
}

export async function collectReliabilityMetrics(): Promise<RenderReliabilityMetricsSnapshot> {
  const [pending, processing, completed, failed] = await Promise.all([
    listJobsByStatus('PENDING'),
    listJobsByStatus('PROCESSING'),
    listJobsByStatus('COMPLETED'),
    listJobsByStatus('FAILED'),
  ]);

  const retryableFailedJobs = failed
    .map(toJobRef)
    .filter(isRetryEligible).length;

  return snapshotReliabilityMetrics({
    pendingJobs: pending.length,
    processingJobs: processing.length,
    completedJobs: completed.length,
    failedJobs: failed.length,
    retryableFailedJobs,
  });
}

export const renderReliabilityService = {
  parseRetryCount,
  stripRetryPrefix,
  formatRetryError,
  classifyFailure,
  recoverStuckProcessingJobs,
  discoverRetryableFailedJobs,
  requeueRetryableFailedJobs,
  runPreCycleMaintenance,
  recordJobFailure,
  collectReliabilityMetrics,
};
