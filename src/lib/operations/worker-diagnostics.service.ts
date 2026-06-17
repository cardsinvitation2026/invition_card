import 'server-only';
import { RENDER_WORKER_POLL_INTERVAL_MS } from '@/features/render-worker/render-worker.constants';
import { collectReliabilityMetrics } from '@/features/render-reliability';
import type { WorkerDiagnosticsSnapshot } from '@/types/operations';

function resolvePollIntervalMs(): number {
  const raw = process.env.RENDER_WORKER_POLL_INTERVAL_MS;
  if (!raw) {
    return RENDER_WORKER_POLL_INTERVAL_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 100) {
    return RENDER_WORKER_POLL_INTERVAL_MS;
  }
  return parsed;
}

export function isWorkerRunning(lastPollAt: string | null): boolean {
  if (process.env.DISABLE_RENDER_WORKER === '1') {
    return false;
  }
  if (!lastPollAt) {
    return false;
  }
  const pollIntervalMs = resolvePollIntervalMs();
  const healthyWindowMs = pollIntervalMs * 2;
  const elapsed = Date.now() - new Date(lastPollAt).getTime();
  return elapsed <= healthyWindowMs;
}

export async function getWorkerDiagnostics(): Promise<WorkerDiagnosticsSnapshot> {
  const metrics = await collectReliabilityMetrics();
  const pollIntervalMs = resolvePollIntervalMs();

  return {
    workerStartedAt: metrics.workerStartedAt,
    lastPollAt: metrics.lastPollAt,
    jobsRetried: metrics.jobsRetried,
    stuckJobsRecovered: metrics.stuckJobsRecovered,
    running: isWorkerRunning(metrics.lastPollAt),
    pollIntervalMs,
    healthyWindowMs: pollIntervalMs * 2,
  };
}

export const workerDiagnosticsService = {
  isWorkerRunning,
  getWorkerDiagnostics,
};
