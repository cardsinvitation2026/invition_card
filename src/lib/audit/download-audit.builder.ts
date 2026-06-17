import 'server-only';
import { draftService } from '@/features/drafts';
import { downloadLogService } from '@/features/download-logs';
import { membershipService } from '@/features/memberships';
import { renderJobService } from '@/features/render-jobs';
import { templateService } from '@/features/templates';
import { buildAuditTimeline } from '@/lib/audit/audit-timeline.builder';
import { createAuditEvent } from '@/lib/audit/audit-event.types';
import type { AuditTimeline } from '@/types/audit';
import type { AuthSession } from '@/types/auth';

const ADMIN_SESSION: AuthSession = {
  userId: 'audit-admin',
  firebaseUid: 'audit-admin',
  email: 'audit-admin@system',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  provider: 'dev',
};

export async function buildDownloadAuditTimeline(
  downloadLogId: string,
): Promise<AuditTimeline | null> {
  const log = await downloadLogService.getDownloadLog(downloadLogId);
  if (!log) {
    return null;
  }

  const [membership, draft] = await Promise.all([
    membershipService.getMembership(log.membershipId),
    draftService.getDraft(log.userId, log.draftId),
  ]);

  const template = draft ? await templateService.getTemplate(draft.draft.templateId) : null;
  const renderJobs = await renderJobService.listRenderJobs(ADMIN_SESSION, {
    page: 1,
    pageSize: 50,
    draftId: log.draftId,
  });
  const sourceRender = renderJobs.items.find((job) => job.status === 'COMPLETED') ?? renderJobs.items[0];

  const events = [
    createAuditEvent({
      timestamp: log.downloadedAt,
      category: 'DOWNLOAD',
      eventType: 'DOWNLOAD_RECORDED',
      title: 'Download recorded',
      description: `Download log ${log.id} created for user ${log.userId}.`,
      entityId: log.id,
      metadata: {
        userId: log.userId,
        draftId: log.draftId,
        membershipId: log.membershipId,
        downloadType: log.downloadType,
        hasFileUrl: Boolean(log.fileUrl),
      },
    }),
  ];

  if (membership) {
    events.push(
      createAuditEvent({
        timestamp: log.downloadedAt,
        category: 'MEMBERSHIP',
        eventType: 'MEMBERSHIP_CONSUMED',
        title: 'Membership quota consumed',
        description: `Membership ${membership.id} consumed one download.`,
        entityId: membership.id,
        metadata: {
          downloadsUsed: membership.downloadsUsed,
          planId: membership.planId,
        },
      }),
    );
  }

  if (draft) {
    events.push(
      createAuditEvent({
        timestamp: draft.draft.createdAt,
        category: 'CUSTOMER',
        eventType: 'DRAFT_SOURCE',
        title: 'Source draft',
        description: draft.draft.title ?? 'Draft linked to download.',
        entityId: draft.draft.id,
        metadata: {
          templateId: draft.draft.templateId,
        },
      }),
    );
  }

  if (template) {
    events.push(
      createAuditEvent({
        timestamp: log.downloadedAt,
        category: 'DOWNLOAD',
        eventType: 'TEMPLATE_SOURCE',
        title: 'Template metadata',
        description: `Template ${template.name} used for this download.`,
        entityId: template.id,
        metadata: {
          slug: template.slug,
        },
      }),
    );
  }

  if (sourceRender) {
    events.push(
      createAuditEvent({
        timestamp: sourceRender.completedAt ?? sourceRender.createdAt,
        category: 'RENDER',
        eventType: 'RENDER_SOURCE',
        title: 'Render source',
        description: `Download sourced from render job ${sourceRender.id} (${sourceRender.status}).`,
        entityId: sourceRender.id,
        metadata: {
          status: sourceRender.status,
          hasFinalUrl: Boolean(sourceRender.finalUrl),
        },
      }),
    );
  }

  return buildAuditTimeline({
    subjectId: downloadLogId,
    subjectType: 'download',
    title: `Download ${log.id}`,
    description: template ? `${template.name} · ${log.downloadedAt}` : log.downloadedAt,
    events,
  });
}

export const downloadAuditBuilder = {
  buildDownloadAuditTimeline,
};
