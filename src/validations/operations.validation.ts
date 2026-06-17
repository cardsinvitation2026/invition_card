import { z } from 'zod';

const componentHealthStatusSchema = z.enum(['healthy', 'unhealthy']);
const healthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);
const workerHealthStatusSchema = z.enum(['running', 'stopped']);

export const publicHealthResponseSchema = z
  .object({
    status: healthStatusSchema,
    timestamp: z.string().datetime(),
    database: z.object({ status: componentHealthStatusSchema }),
    cloudinary: z.object({ status: componentHealthStatusSchema }),
    razorpay: z.object({ status: componentHealthStatusSchema }),
    worker: z.object({ status: workerHealthStatusSchema }),
  })
  .strict();

export const environmentValidationResultSchema = z
  .object({
    mode: z.enum(['development', 'production']),
    valid: z.boolean(),
    missingVariables: z.array(z.string()),
    configuredVariables: z.array(z.string()),
  })
  .strict();

export const workerDiagnosticsSnapshotSchema = z
  .object({
    workerStartedAt: z.string().datetime().nullable(),
    lastPollAt: z.string().datetime().nullable(),
    jobsRetried: z.number().int().min(0),
    stuckJobsRecovered: z.number().int().min(0),
    running: z.boolean(),
    pollIntervalMs: z.number().int().positive(),
    healthyWindowMs: z.number().int().positive(),
  })
  .strict();

export const queueDiagnosticsSnapshotSchema = z
  .object({
    pendingJobs: z.number().int().min(0),
    processingJobs: z.number().int().min(0),
    completedJobs: z.number().int().min(0),
    failedJobs: z.number().int().min(0),
    retryableFailedJobs: z.number().int().min(0),
  })
  .strict();

export const deploymentReadinessResultSchema = z
  .object({
    ready: z.boolean(),
    issues: z.array(z.string()),
    checks: z
      .object({
        databaseReachable: z.boolean(),
        cloudinaryConfigured: z.boolean(),
        razorpayConfigured: z.boolean(),
        webhookSecretConfigured: z.boolean(),
        workerRunning: z.boolean(),
        healthEndpointFunctional: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const adminOperationsSnapshotSchema = z
  .object({
    health: publicHealthResponseSchema,
    environment: environmentValidationResultSchema,
    worker: workerDiagnosticsSnapshotSchema,
    queue: queueDiagnosticsSnapshotSchema,
    deployment: deploymentReadinessResultSchema,
  })
  .strict();
