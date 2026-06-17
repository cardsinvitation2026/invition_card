export interface PendingRenderJob {
  id: string;
  draftId: string;
  createdAt: string;
}

export interface RenderWorkerRunnerState {
  running: boolean;
  stopped: boolean;
  polling: boolean;
  pollCount: number;
  lastPollAt: string | null;
}

export interface RenderWorkerProcessResult {
  processed: boolean;
  jobId: string | null;
  skippedLocked: boolean;
}
