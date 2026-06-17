import type { RenderReliabilityMetricsSnapshot } from '@/features/render-reliability/render-reliability.types';

let stuckJobsRecovered = 0;
let jobsRetried = 0;
let workerStartedAt: string | null = null;
let lastPollAt: string | null = null;

export function resetReliabilityMetrics(): void {
  stuckJobsRecovered = 0;
  jobsRetried = 0;
  workerStartedAt = null;
  lastPollAt = null;
}

export function recordWorkerStartedAt(value: string = new Date().toISOString()): void {
  workerStartedAt = value;
}

export function recordLastPollAt(value: string = new Date().toISOString()): void {
  lastPollAt = value;
}

export function recordStuckJobsRecovered(count: number): void {
  stuckJobsRecovered += count;
}

export function recordJobsRetried(count: number = 1): void {
  jobsRetried += count;
}

export function snapshotReliabilityMetrics(
  counts: Pick<
    RenderReliabilityMetricsSnapshot,
    'pendingJobs' | 'processingJobs' | 'completedJobs' | 'failedJobs' | 'retryableFailedJobs'
  >,
): RenderReliabilityMetricsSnapshot {
  return {
    ...counts,
    stuckJobsRecovered,
    jobsRetried,
    workerStartedAt,
    lastPollAt,
  };
}
