import 'server-only';
import { renderJobService } from '@/features/render-jobs';
import { membershipService } from '@/features/memberships';
import { downloadLogService } from '@/features/download-logs';
import { cloudinaryDeliveryService } from '@/lib/cloudinary/cloudinary-delivery.service';
import type { AuthSession } from '@/types/auth';
import type { MembershipDetail } from '@/types/membership-engine';
import type { ExecuteDownloadResult } from '@/types/download-log';
import type { DownloadLogListQueryInput } from '@/validations/download-log.validation';
import type { RenderJobDetail } from '@/types/render-job';
import { DownloadErrorCode, DownloadServiceError } from './download.errors';
import { DownloadLogQuotaError } from '@/features/download-logs/download-log.errors';

export interface DownloadValidationResult {
  renderJob: RenderJobDetail;
  membershipId: string;
  finalUrl: string;
}

/**
 * Membership consumption order:
 * 1. Unlimited plan first (downloadLimit = null), earliest startDate.
 * 2. Otherwise oldest ACTIVE membership with remaining quota.
 */
export function selectMembershipForConsumption(
  activeMemberships: MembershipDetail[],
): string | null {
  const byStartDate = (a: MembershipDetail, b: MembershipDetail) =>
    a.startDate.localeCompare(b.startDate);

  const unlimited = activeMemberships
    .filter((membership) => membership.plan?.downloadLimit === null)
    .sort(byStartDate);
  if (unlimited.length > 0) {
    return unlimited[0].id;
  }

  const withQuota = activeMemberships
    .filter((membership) => {
      const limit = membership.plan?.downloadLimit;
      if (limit === null || limit === undefined) {
        return false;
      }
      return membership.downloadsUsed < limit;
    })
    .sort(byStartDate);

  return withQuota[0]?.id ?? null;
}

export const downloadService = {
  async validateDownload(
    session: AuthSession,
    renderJobId: string,
  ): Promise<DownloadValidationResult> {
    const renderJob = await renderJobService.getRenderJob(session, renderJobId);
    if (!renderJob) {
      throw new DownloadServiceError(DownloadErrorCode.DOWNLOAD_NOT_FOUND);
    }

    if (renderJob.status !== 'COMPLETED') {
      throw new DownloadServiceError(DownloadErrorCode.RENDER_NOT_COMPLETED);
    }

    if (!renderJob.finalUrl) {
      throw new DownloadServiceError(DownloadErrorCode.DOWNLOAD_URL_MISSING);
    }

    const { memberships } = await membershipService.resolveActiveMembership(session.userId);
    if (memberships.length === 0) {
      throw new DownloadServiceError(DownloadErrorCode.MEMBERSHIP_REQUIRED);
    }

    const membershipId = selectMembershipForConsumption(memberships);
    if (!membershipId) {
      throw new DownloadServiceError(DownloadErrorCode.DOWNLOAD_LIMIT_REACHED);
    }

    return {
      renderJob,
      membershipId,
      finalUrl: renderJob.finalUrl,
    };
  },

  async executeDownload(
    session: AuthSession,
    renderJobId: string,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ExecuteDownloadResult> {
    const validated = await this.validateDownload(session, renderJobId);

    let log;
    try {
      log = await downloadLogService.recordDownloadWithQuotaConsumption({
        userId: session.userId,
        draftId: validated.renderJob.draftId,
        membershipId: validated.membershipId,
        downloadType: 'video',
        fileUrl: validated.finalUrl,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      });
    } catch (error) {
      if (error instanceof DownloadLogQuotaError) {
        throw new DownloadServiceError(DownloadErrorCode.DOWNLOAD_LIMIT_REACHED);
      }
      throw error;
    }

    const signed = cloudinaryDeliveryService.generateSignedVideoUrl(validated.finalUrl);

    return {
      url: signed.url,
      expiresAt: signed.expiresAt,
      downloadLogId: log.id,
    };
  },

  async getDownloadHistory(userId: string, input: DownloadLogListQueryInput) {
    const result = await downloadLogService.listByUser(userId, input);
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        hasVideo: Boolean(item.fileUrl),
        fileUrl: null,
      })),
    };
  },
};
