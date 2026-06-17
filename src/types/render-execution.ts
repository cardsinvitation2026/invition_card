import type { FamilyInputProps } from '@/remotion/types/family-input-props';

export interface RenderExecutionContext {
  jobId: string;
  compositionId: string;
  inputProps: FamilyInputProps;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

export interface RenderExecutionInput {
  jobId: string;
  userId: string;
  draftId: string;
  templateId: string;
}
