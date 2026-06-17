import 'server-only';
import { downloadLogService } from '@/features/download-logs';
import { renderJobService } from '@/features/render-jobs';
import { cloudinaryDeliveryService } from '@/lib/cloudinary/cloudinary-delivery.service';
import type { AuthSession } from '@/types/auth';
import type { SignedVideoAccess } from '@/types/video-access';
import { VideoAccessError, VideoAccessErrorCode } from './video-access.errors';

function toSignedAccess(result: { url: string; expiresAt: string }): SignedVideoAccess {
  return {
    url: result.url,
    expiresAt: result.expiresAt,
  };
}

export const videoAccessService = {
  async getRenderVideoAccess(
    session: AuthSession,
    renderJobId: string,
  ): Promise<SignedVideoAccess> {
    const job = await renderJobService.getRenderJob(session, renderJobId);
    if (!job) {
      throw new VideoAccessError(VideoAccessErrorCode.VIDEO_NOT_FOUND);
    }

    if (job.status !== 'COMPLETED') {
      throw new VideoAccessError(VideoAccessErrorCode.VIDEO_NOT_AVAILABLE);
    }

    if (!job.finalUrl) {
      throw new VideoAccessError(VideoAccessErrorCode.VIDEO_URL_MISSING);
    }

    return toSignedAccess(cloudinaryDeliveryService.generateSignedVideoUrl(job.finalUrl));
  },

  async getDownloadHistoryVideoAccess(
    session: AuthSession,
    downloadLogId: string,
  ): Promise<SignedVideoAccess> {
    const log = await downloadLogService.getDownloadLogForUser(downloadLogId, session.userId);
    if (!log) {
      throw new VideoAccessError(VideoAccessErrorCode.VIDEO_NOT_FOUND);
    }

    if (!log.fileUrl) {
      throw new VideoAccessError(VideoAccessErrorCode.VIDEO_URL_MISSING);
    }

    return toSignedAccess(cloudinaryDeliveryService.generateSignedVideoUrl(log.fileUrl));
  },
};
