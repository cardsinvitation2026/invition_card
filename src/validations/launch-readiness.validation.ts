import { z } from 'zod';

const readinessCheckStatusSchema = z.enum(['pass', 'fail', 'warn', 'unknown']);

export const readinessCheckItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: readinessCheckStatusSchema,
  critical: z.boolean(),
  message: z.string(),
  details: z.array(z.string()).optional(),
});

export const launchReadinessSnapshotSchema = z.object({
  decision: z.enum(['READY', 'NOT_READY']),
  blockers: z.array(z.string()),
  warnings: z.array(z.string()),
  generatedAt: z.string(),
  environment: z.object({
    mode: z.enum(['development', 'production']),
    blocking: z.boolean(),
    checks: z.array(readinessCheckItemSchema),
    missingVariables: z.array(z.string()),
    configuredVariables: z.array(z.string()),
  }),
  database: z.object({
    checks: z.array(readinessCheckItemSchema),
    connected: z.boolean(),
    prismaAvailable: z.boolean(),
    readAccess: z.boolean(),
    writeAccess: z.boolean(),
    migrationVisibility: z.object({
      available: z.boolean(),
      appliedCount: z.number().nullable(),
      latestMigration: z.string().nullable(),
    }),
  }),
  cloudinary: z.object({
    checks: z.array(readinessCheckItemSchema),
    configured: z.boolean(),
    signedDeliveryAvailable: z.boolean(),
    uploadConfigured: z.boolean(),
  }),
  razorpay: z.object({
    checks: z.array(readinessCheckItemSchema),
    configured: z.boolean(),
    webhookSecretConfigured: z.boolean(),
    checkoutAvailable: z.boolean(),
    signatureVerificationAvailable: z.boolean(),
  }),
  worker: z.object({
    checks: z.array(readinessCheckItemSchema),
    running: z.boolean(),
    heartbeatVisible: z.boolean(),
    lastPollAt: z.string().nullable(),
    distributedClaimAvailable: z.boolean(),
    reliabilityLayerAvailable: z.boolean(),
  }),
  security: z.object({
    checks: z.array(readinessCheckItemSchema),
    allHardeningSignalsPresent: z.boolean(),
  }),
  disasterRecovery: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        procedure: z.string(),
        ownership: z.string(),
        verificationSteps: z.array(z.string()),
      }),
    ),
  }),
  verification: z.object({
    suites: z.array(
      z.object({
        script: z.string(),
        label: z.string(),
        status: z.enum(['PASS', 'FAIL', 'UNKNOWN']),
        scriptPresent: z.boolean(),
      }),
    ),
  }),
});
