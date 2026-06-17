export type {
  AdminOperationsSnapshot,
  ComponentHealthStatus,
  DeploymentReadinessResult,
  EnvironmentValidationResult,
  HealthStatus,
  PublicHealthResponse,
  QueueDiagnosticsSnapshot,
  WorkerDiagnosticsSnapshot,
  WorkerHealthStatus,
} from '@/types/operations';
export {
  PRODUCTION_REQUIRED_ENV_VARIABLES,
  environmentCheckService,
  validateEnvironment,
} from '@/lib/operations/environment-check.service';
export {
  getPublicHealth,
  healthService,
  isDatabaseReachable,
  isCloudinaryConfigured,
  isRazorpayConfigured,
  isWebhookSecretConfigured,
} from '@/lib/operations/health.service';
export {
  getWorkerDiagnostics,
  isWorkerRunning,
  workerDiagnosticsService,
} from '@/lib/operations/worker-diagnostics.service';
export {
  getQueueDiagnostics,
  queueDiagnosticsService,
} from '@/lib/operations/queue-diagnostics.service';
export {
  deploymentReadinessService,
  getDeploymentReadiness,
} from '@/lib/operations/deployment-readiness.service';

import type { AdminOperationsSnapshot } from '@/types/operations';
import { validateEnvironment } from '@/lib/operations/environment-check.service';
import { getPublicHealth } from '@/lib/operations/health.service';
import { getWorkerDiagnostics } from '@/lib/operations/worker-diagnostics.service';
import { getQueueDiagnostics } from '@/lib/operations/queue-diagnostics.service';
import { getDeploymentReadiness } from '@/lib/operations/deployment-readiness.service';

export async function getAdminOperationsSnapshot(): Promise<AdminOperationsSnapshot> {
  const [health, environment, worker, queue, deployment] = await Promise.all([
    getPublicHealth(),
    Promise.resolve(validateEnvironment()),
    getWorkerDiagnostics(),
    getQueueDiagnostics(),
    getDeploymentReadiness(),
  ]);

  return {
    health,
    environment,
    worker,
    queue,
    deployment,
  };
}

export const operationsService = {
  getAdminOperationsSnapshot,
  getPublicHealth,
  validateEnvironment,
  getWorkerDiagnostics,
  getQueueDiagnostics,
  getDeploymentReadiness,
};
