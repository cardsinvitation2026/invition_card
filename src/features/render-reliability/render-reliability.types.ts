export type FailureClassification = 'retryable' | 'non_retryable';

export interface RenderReliabilityJobRef {
  id: string;
  draftId: string;
  status: string;
  error: string | null;
  finalUrl: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface RenderReliabilityMetricsSnapshot {
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  retryableFailedJobs: number;
  stuckJobsRecovered: number;
  jobsRetried: number;
  workerStartedAt: string | null;
  lastPollAt: string | null;
}
