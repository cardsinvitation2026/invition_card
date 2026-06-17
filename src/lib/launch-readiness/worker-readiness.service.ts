import 'server-only';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getWorkerDiagnostics } from '@/lib/operations/worker-diagnostics.service';
import { collectReliabilityMetrics } from '@/features/render-reliability';
import { createReadinessCheck } from '@/lib/launch-readiness/readiness.types';
import type { WorkerReadinessSnapshot } from '@/types/launch-readiness';

function distributedClaimAvailable(): boolean {
  try {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/render-worker/render-worker.service.ts'),
      'utf8',
    );
    return source.includes('claimPendingRenderJob');
  } catch {
    return false;
  }
}

export async function evaluateWorkerReadiness(): Promise<WorkerReadinessSnapshot> {
  const [worker, metrics] = await Promise.all([
    getWorkerDiagnostics(),
    collectReliabilityMetrics(),
  ]);

  const heartbeatVisible = Boolean(worker.workerStartedAt || worker.lastPollAt);
  const distributedClaim = distributedClaimAvailable();
  const reliabilityLayerAvailable =
    typeof metrics.pendingJobs === 'number' && typeof metrics.jobsRetried === 'number';

  const checks = [
    createReadinessCheck({
      id: 'worker_running',
      label: 'Render worker running',
      status: worker.running ? 'pass' : 'fail',
      critical: true,
      message: worker.running ? 'Worker heartbeat active' : 'Worker not running',
      details: worker.lastPollAt ? [`Last poll: ${worker.lastPollAt}`] : undefined,
    }),
    createReadinessCheck({
      id: 'worker_heartbeat',
      label: 'Worker heartbeat visible',
      status: heartbeatVisible ? 'pass' : 'warn',
      critical: false,
      message: heartbeatVisible ? 'Heartbeat timestamps available' : 'No heartbeat timestamps yet',
    }),
    createReadinessCheck({
      id: 'worker_distributed_claim',
      label: 'Distributed claim engine',
      status: distributedClaim ? 'pass' : 'fail',
      critical: true,
      message: distributedClaim
        ? 'Database-backed claim path detected'
        : 'Distributed claim engine unavailable',
    }),
    createReadinessCheck({
      id: 'worker_reliability_layer',
      label: 'Reliability layer',
      status: reliabilityLayerAvailable ? 'pass' : 'fail',
      critical: true,
      message: reliabilityLayerAvailable
        ? 'Stage 16C reliability metrics available'
        : 'Reliability layer unavailable',
    }),
  ];

  return {
    checks,
    running: worker.running,
    heartbeatVisible,
    lastPollAt: worker.lastPollAt,
    distributedClaimAvailable: distributedClaim,
    reliabilityLayerAvailable,
  };
}

export const workerReadinessService = {
  evaluateWorkerReadiness,
};
