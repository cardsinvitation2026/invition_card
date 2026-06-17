import 'server-only';
import { getAdminOperationsSnapshot } from '@/lib/operations';
import { collectReliabilityMetrics } from '@/features/render-reliability';
import type { SystemObservabilitySnapshot } from '@/types/audit';

export async function getSystemObservabilitySnapshot(): Promise<SystemObservabilitySnapshot> {
  const [operations, reliability] = await Promise.all([
    getAdminOperationsSnapshot(),
    collectReliabilityMetrics(),
  ]);

  return {
    health: operations.health,
    environment: operations.environment,
    worker: operations.worker,
    queue: operations.queue,
    deployment: operations.deployment,
    reliability,
    generatedAt: new Date().toISOString(),
  };
}

export const systemObservabilityService = {
  getSystemObservabilitySnapshot,
};
