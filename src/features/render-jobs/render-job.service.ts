import 'server-only';
import type { RenderJobRepository } from './render-job.repository';
import { prismaRenderJobRepository } from './prisma-render-job.repository';
import { inMemoryRenderJobRepository } from './inmemory-render-job.repository';
import { assertValidRenderJobStatusTransition } from './render-job.lifecycle';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { draftService } from '@/features/drafts';
import { templateService } from '@/features/templates';
import type { RenderJobCreateInput, RenderJobListQueryInput } from '@/validations/render-job.validation';
import type { AuthSession } from '@/types/auth';
import type {
  RenderJobDetail,
  RenderJobListQuery,
  RenderJobListResult,
  RenderJobStatusUpdate,
} from '@/types/render-job';
import { renderVideoService } from '@/remotion/render/render-video.service';
import { cloudinaryVideoService } from '@/lib/cloudinary/cloudinary-video.service';

function repo(): RenderJobRepository {
  return hasDatabaseUrl() ? prismaRenderJobRepository : inMemoryRenderJobRepository;
}

function toListQuery(input: RenderJobListQueryInput): RenderJobListQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    draftId: input.draftId,
    status: input.status,
  };
}

export const renderJobService = {
  async createRenderJob(userId: string, input: RenderJobCreateInput): Promise<RenderJobDetail> {
    const draft = await draftService.getDraft(userId, input.draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    if (draft.draft.templateId !== input.templateId) {
      throw new Error('Draft template mismatch');
    }

    const template = await templateService.getTemplate(input.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return repo().create({ draftId: input.draftId });
  },

  async getRenderJob(session: AuthSession, jobId: string): Promise<RenderJobDetail | null> {
    if (session.role === 'SUPER_ADMIN') {
      return repo().findById(jobId);
    }
    return repo().findByIdForUser(jobId, session.userId);
  },

  async listRenderJobs(
    session: AuthSession,
    input: RenderJobListQueryInput,
  ): Promise<RenderJobListResult> {
    const query = toListQuery(input);
    if (session.role === 'SUPER_ADMIN') {
      return repo().listAll(query);
    }
    return repo().listByUser(session.userId, query);
  },

  async updateRenderJobStatus(
    jobId: string,
    update: RenderJobStatusUpdate,
  ): Promise<RenderJobDetail> {
    const existing = await repo().findById(jobId);
    if (!existing) {
      throw new Error('Render job not found');
    }

    assertValidRenderJobStatusTransition(existing.status, update.status);

    return repo().updateStatus(jobId, update);
  },

  async claimPendingRenderJob(jobId: string): Promise<boolean> {
    return repo().claimPending(jobId);
  },

  async executeRenderJob(session: AuthSession, jobId: string): Promise<RenderJobDetail> {
    const job = await this.getRenderJob(session, jobId);
    if (!job) {
      throw new Error('Render job not found');
    }

    if (job.status === 'PENDING') {
      await this.updateRenderJobStatus(jobId, {
        status: 'PROCESSING',
        startedAt: new Date().toISOString(),
        error: null,
      });
    } else if (job.status !== 'PROCESSING') {
      throw new Error('Render job is not in PENDING status');
    }

    try {
      const result = await renderVideoService.execute({
        jobId: job.id,
        userId: session.userId,
        draftId: job.draftId,
        templateId: job.templateId,
      });

      const upload = await cloudinaryVideoService.uploadRenderVideo({
        jobId: job.id,
        localFilePath: result.outputPath,
      });

      return await this.updateRenderJobStatus(jobId, {
        status: 'COMPLETED',
        finalUrl: upload.url,
        completedAt: new Date().toISOString(),
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Render failed';
      return await this.updateRenderJobStatus(jobId, {
        status: 'FAILED',
        error: message,
        completedAt: new Date().toISOString(),
      });
    }
  },
};
