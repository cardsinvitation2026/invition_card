export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export type ComponentHealthStatus = 'healthy' | 'unhealthy';

export type WorkerHealthStatus = 'running' | 'stopped';

export interface PublicHealthResponse {
  status: HealthStatus;
  timestamp: string;
  database: {
    status: ComponentHealthStatus;
  };
  cloudinary: {
    status: ComponentHealthStatus;
  };
  razorpay: {
    status: ComponentHealthStatus;
  };
  worker: {
    status: WorkerHealthStatus;
  };
}

export interface EnvironmentValidationResult {
  mode: 'development' | 'production';
  valid: boolean;
  missingVariables: string[];
  configuredVariables: string[];
}

export interface WorkerDiagnosticsSnapshot {
  workerStartedAt: string | null;
  lastPollAt: string | null;
  jobsRetried: number;
  stuckJobsRecovered: number;
  running: boolean;
  pollIntervalMs: number;
  healthyWindowMs: number;
}

export interface QueueDiagnosticsSnapshot {
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  retryableFailedJobs: number;
}

export interface DeploymentReadinessResult {
  ready: boolean;
  issues: string[];
  checks: {
    databaseReachable: boolean;
    cloudinaryConfigured: boolean;
    razorpayConfigured: boolean;
    webhookSecretConfigured: boolean;
    workerRunning: boolean;
    healthEndpointFunctional: boolean;
  };
}

export interface AdminOperationsSnapshot {
  health: PublicHealthResponse;
  environment: EnvironmentValidationResult;
  worker: WorkerDiagnosticsSnapshot;
  queue: QueueDiagnosticsSnapshot;
  deployment: DeploymentReadinessResult;
}
