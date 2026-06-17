import type { RenderJobStatus } from '@/types/render-job';

export interface AdminRenderJobListItem {
  id: string;
  draftId: string;
  templateId: string;
  templateName: string;
  templateSlug: string;
  userName: string | null;
  userEmail: string;
  status: RenderJobStatus;
  createdAt: string;
  completedAt: string | null;
  finalUrl: string | null;
  error: string | null;
}

export interface AdminRenderJobDetail extends AdminRenderJobListItem {
  startedAt: string | null;
  previewUrl: string | null;
}

export interface AdminRenderJobSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface AdminRenderJobListResult {
  items: AdminRenderJobListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: AdminRenderJobSummary;
}
