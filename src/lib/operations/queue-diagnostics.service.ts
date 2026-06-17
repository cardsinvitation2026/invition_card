import 'server-only';
import { collectReliabilityMetrics } from '@/features/render-reliability';
import type { QueueDiagnosticsSnapshot } from '@/types/operations';

export async function getQueueDiagnostics(): Promise<QueueDiagnosticsSnapshot> {
  const metrics = await collectReliabilityMetrics();

  return {
    pendingJobs: metrics.pendingJobs,
    processingJobs: metrics.processingJobs,
    completedJobs: metrics.completedJobs,
    failedJobs: metrics.failedJobs,
    retryableFailedJobs: metrics.retryableFailedJobs,
  };
}

export const queueDiagnosticsService = {
  getQueueDiagnostics,
};
