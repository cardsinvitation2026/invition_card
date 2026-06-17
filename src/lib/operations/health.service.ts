import 'server-only';
import { getPrisma } from '@/lib/prisma/client';
import { cloudinaryService } from '@/lib/cloudinary/client';
import { razorpayService } from '@/lib/razorpay/client';
import { razorpayWebhookSignatureService } from '@/lib/razorpay/razorpay-webhook-signature.service';
import { getWorkerDiagnostics } from '@/lib/operations/worker-diagnostics.service';
import type {
  ComponentHealthStatus,
  HealthStatus,
  PublicHealthResponse,
} from '@/types/operations';

async function checkDatabaseHealth(): Promise<ComponentHealthStatus> {
  const prisma = getPrisma();
  if (!prisma) {
    return 'unhealthy';
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

function checkCloudinaryHealth(): ComponentHealthStatus {
  return cloudinaryService.isReady() ? 'healthy' : 'unhealthy';
}

function checkRazorpayHealth(): ComponentHealthStatus {
  return razorpayService.isReady() ? 'healthy' : 'unhealthy';
}

function resolveOverallHealth(input: {
  database: ComponentHealthStatus;
  cloudinary: ComponentHealthStatus;
  razorpay: ComponentHealthStatus;
  workerRunning: boolean;
}): HealthStatus {
  if (input.database === 'unhealthy') {
    return 'unhealthy';
  }

  const integrationsHealthy =
    input.cloudinary === 'healthy' &&
    input.razorpay === 'healthy' &&
    input.workerRunning;

  return integrationsHealthy ? 'healthy' : 'degraded';
}

export async function getPublicHealth(): Promise<PublicHealthResponse> {
  const [databaseStatus, worker] = await Promise.all([
    checkDatabaseHealth(),
    getWorkerDiagnostics(),
  ]);
  const cloudinaryStatus = checkCloudinaryHealth();
  const razorpayStatus = checkRazorpayHealth();
  const workerStatus = worker.running ? 'running' : 'stopped';

  return {
    status: resolveOverallHealth({
      database: databaseStatus,
      cloudinary: cloudinaryStatus,
      razorpay: razorpayStatus,
      workerRunning: worker.running,
    }),
    timestamp: new Date().toISOString(),
    database: { status: databaseStatus },
    cloudinary: { status: cloudinaryStatus },
    razorpay: { status: razorpayStatus },
    worker: { status: workerStatus },
  };
}

export async function isDatabaseReachable(): Promise<boolean> {
  return (await checkDatabaseHealth()) === 'healthy';
}

export function isCloudinaryConfigured(): boolean {
  return cloudinaryService.isReady();
}

export function isRazorpayConfigured(): boolean {
  return razorpayService.isReady();
}

export function isWebhookSecretConfigured(): boolean {
  return Boolean(razorpayWebhookSignatureService.getWebhookSecret());
}

export const healthService = {
  getPublicHealth,
  isDatabaseReachable,
  isCloudinaryConfigured,
  isRazorpayConfigured,
  isWebhookSecretConfigured,
};
