export type ReadinessCheckStatus = 'pass' | 'fail' | 'warn' | 'unknown';

export type LaunchDecisionStatus = 'READY' | 'NOT_READY';

export type VerificationSuiteStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface ReadinessCheckItem {
  id: string;
  label: string;
  status: ReadinessCheckStatus;
  critical: boolean;
  message: string;
  details?: string[];
}

export interface EnvironmentReadinessSnapshot {
  mode: 'development' | 'production';
  blocking: boolean;
  checks: ReadinessCheckItem[];
  missingVariables: string[];
  configuredVariables: string[];
}

export interface DatabaseReadinessSnapshot {
  checks: ReadinessCheckItem[];
  connected: boolean;
  prismaAvailable: boolean;
  readAccess: boolean;
  writeAccess: boolean;
  migrationVisibility: {
    available: boolean;
    appliedCount: number | null;
    latestMigration: string | null;
  };
}

export interface CloudinaryReadinessSnapshot {
  checks: ReadinessCheckItem[];
  configured: boolean;
  signedDeliveryAvailable: boolean;
  uploadConfigured: boolean;
}

export interface RazorpayReadinessSnapshot {
  checks: ReadinessCheckItem[];
  configured: boolean;
  webhookSecretConfigured: boolean;
  checkoutAvailable: boolean;
  signatureVerificationAvailable: boolean;
}

export interface WorkerReadinessSnapshot {
  checks: ReadinessCheckItem[];
  running: boolean;
  heartbeatVisible: boolean;
  lastPollAt: string | null;
  distributedClaimAvailable: boolean;
  reliabilityLayerAvailable: boolean;
}

export interface SecurityReadinessSnapshot {
  checks: ReadinessCheckItem[];
  allHardeningSignalsPresent: boolean;
}

export interface DisasterRecoveryItem {
  id: string;
  title: string;
  procedure: string;
  ownership: string;
  verificationSteps: string[];
}

export interface DisasterRecoverySnapshot {
  items: DisasterRecoveryItem[];
}

export interface VerificationSuiteItem {
  script: string;
  label: string;
  status: VerificationSuiteStatus;
  scriptPresent: boolean;
}

export interface VerificationReadinessSnapshot {
  suites: VerificationSuiteItem[];
}

export interface LaunchReadinessSnapshot {
  decision: LaunchDecisionStatus;
  blockers: string[];
  warnings: string[];
  generatedAt: string;
  environment: EnvironmentReadinessSnapshot;
  database: DatabaseReadinessSnapshot;
  cloudinary: CloudinaryReadinessSnapshot;
  razorpay: RazorpayReadinessSnapshot;
  worker: WorkerReadinessSnapshot;
  security: SecurityReadinessSnapshot;
  disasterRecovery: DisasterRecoverySnapshot;
  verification: VerificationReadinessSnapshot;
}
