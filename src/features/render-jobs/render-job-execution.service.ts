import 'server-only';
import { cloudinaryVideoService } from '@/lib/cloudinary/cloudinary-video.service';
import { renderVideoService } from '@/remotion/render/render-video.service';
import type { AuthSession } from '@/types/auth';
import type { RenderJobDetail } from '@/types/render-job';
import { renderJobService } from './render-job.service';

export async function executeRenderJob(
  session: AuthSession,
  jobId: string,
): Promise<RenderJobDetail> {
  const job = await renderJobService.getRenderJob(session, jobId);
  if (!job) {
    throw new Error('Render job not found');
  }

  if (job.status === 'PENDING') {
    await renderJobService.updateRenderJobStatus(jobId, {
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

    return await renderJobService.updateRenderJobStatus(jobId, {
      status: 'COMPLETED',
      finalUrl: upload.url,
      completedAt: new Date().toISOString(),
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Render failed';
    return await renderJobService.updateRenderJobStatus(jobId, {
      status: 'FAILED',
      error: message,
      completedAt: new Date().toISOString(),
    });
  }
}
