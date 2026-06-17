export type RenderJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface RenderJobDetail {
  id: string;
  draftId: string;
  templateId: string;
  status: RenderJobStatus;
  previewUrl: string | null;
  finalUrl: string | null;
  error: string | null;
  attempt: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RenderJobListQuery {
  page: number;
  pageSize: number;
  draftId?: string;
  status?: RenderJobStatus;
}

export interface RenderJobListResult {
  items: RenderJobDetail[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface RenderJobCreateData {
  draftId: string;
}

export interface RenderJobStatusUpdate {
  status: RenderJobStatus;
  previewUrl?: string | null;
  finalUrl?: string | null;
  error?: string | null;
  attempt?: number;
  startedAt?: string | null;
  completedAt?: string | null;
}
