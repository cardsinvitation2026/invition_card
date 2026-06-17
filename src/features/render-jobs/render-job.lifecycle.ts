import type { RenderJobStatus } from '@/types/render-job';

export const RENDER_JOB_STATUS_TRANSITIONS: Record<
  RenderJobStatus,
  readonly RenderJobStatus[]
> = {
  PENDING: ['PROCESSING', 'FAILED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export function isValidRenderJobStatusTransition(
  from: RenderJobStatus,
  to: RenderJobStatus,
): boolean {
  return RENDER_JOB_STATUS_TRANSITIONS[from].includes(to);
}

export function assertValidRenderJobStatusTransition(
  from: RenderJobStatus,
  to: RenderJobStatus,
): void {
  if (!isValidRenderJobStatusTransition(from, to)) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }
}
