import 'server-only';
import { validateEnvironment } from '@/lib/operations/environment-check.service';
import {
  getPublicHealth,
  healthService,
  isDatabaseReachable,
} from '@/lib/operations/health.service';
import { getWorkerDiagnostics } from '@/lib/operations/worker-diagnostics.service';
import type { DeploymentReadinessResult } from '@/types/operations';

export async function getDeploymentReadiness(): Promise<DeploymentReadinessResult> {
  const [
    databaseReachable,
    cloudinaryConfigured,
    razorpayConfigured,
    webhookSecretConfigured,
    worker,
    health,
    environment,
  ] = await Promise.all([
    isDatabaseReachable(),
    Promise.resolve(healthService.isCloudinaryConfigured()),
    Promise.resolve(healthService.isRazorpayConfigured()),
    Promise.resolve(healthService.isWebhookSecretConfigured()),
    getWorkerDiagnostics(),
    getPublicHealth(),
    Promise.resolve(validateEnvironment()),
  ]);

  const checks = {
    databaseReachable,
    cloudinaryConfigured,
    razorpayConfigured,
    webhookSecretConfigured,
    workerRunning: worker.running,
    healthEndpointFunctional: Boolean(health.timestamp && health.status),
  };

  const issues: string[] = [];

  if (!checks.databaseReachable) {
    issues.push('Database is not reachable.');
  }
  if (!checks.cloudinaryConfigured) {
    issues.push('Cloudinary is not fully configured.');
  }
  if (!checks.razorpayConfigured) {
    issues.push('Razorpay is not fully configured.');
  }
  if (!checks.webhookSecretConfigured) {
    issues.push('Razorpay webhook secret is not configured.');
  }
  if (!checks.workerRunning) {
    issues.push('Render worker is not running.');
  }
  if (!checks.healthEndpointFunctional) {
    issues.push('Health endpoint is not functional.');
  }
  if (!environment.valid) {
    issues.push(
      `Missing production environment variables: ${environment.missingVariables.join(', ')}`,
    );
  }

  return {
    ready: issues.length === 0,
    issues,
    checks,
  };
}

export const deploymentReadinessService = {
  getDeploymentReadiness,
};
