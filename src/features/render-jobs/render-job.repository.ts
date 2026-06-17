import type {
  RenderJobCreateData,
  RenderJobDetail,
  RenderJobListQuery,
  RenderJobListResult,
  RenderJobStatus,
  RenderJobStatusUpdate,
} from '@/types/render-job';

export interface RenderJobRepository {
  create(input: RenderJobCreateData): Promise<RenderJobDetail>;
  findById(id: string): Promise<RenderJobDetail | null>;
  findByIdForUser(id: string, userId: string): Promise<RenderJobDetail | null>;
  listByUser(userId: string, query: RenderJobListQuery): Promise<RenderJobListResult>;
  listAll(query: RenderJobListQuery): Promise<RenderJobListResult>;
  updateStatus(id: string, update: RenderJobStatusUpdate): Promise<RenderJobDetail>;
  claimPending(id: string): Promise<boolean>;
}

export type { RenderJobDetail, RenderJobStatus };
