import 'server-only';
import { parseRetryCount } from '@/features/render-reliability';
import { renderJobService } from '@/features/render-jobs';
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

export async function buildRenderAuditTimeline(renderJobId: string): Promise<AuditTimeline | null> {
  const job = await renderJobService.getRenderJob(ADMIN_SESSION, renderJobId);
  if (!job) {
    return null;
  }

  const retryCount = parseRetryCount(job.error);
  const events = [
    createAuditEvent({
      timestamp: job.createdAt,
      category: 'RENDER',
      eventType: 'RENDER_JOB_CREATED',
      title: 'Render job created',
      description: `Render job ${job.id} created for draft ${job.draftId}.`,
      entityId: job.id,
      metadata: {
        draftId: job.draftId,
        templateId: job.templateId,
        attempt: job.attempt,
      },
    }),
  ];

  if (job.startedAt) {
    events.push(
      createAuditEvent({
        timestamp: job.startedAt,
        category: 'RENDER',
        eventType: 'RENDER_PROCESSING',
        title: 'Processing started',
        description: 'Render job entered PROCESSING state.',
        entityId: job.id,
        metadata: { status: job.status },
      }),
    );
  }

  if (job.status === 'COMPLETED' && job.completedAt) {
    events.push(
      createAuditEvent({
        timestamp: job.completedAt,
        category: 'RENDER',
        eventType: 'RENDER_COMPLETED',
        title: 'Render completed',
        description: 'Render job completed successfully.',
        entityId: job.id,
        metadata: {
          hasFinalUrl: Boolean(job.finalUrl),
          hasPreviewUrl: Boolean(job.previewUrl),
        },
      }),
    );
  }

  if (job.status === 'FAILED') {
    events.push(
      createAuditEvent({
        timestamp: job.completedAt ?? job.updatedAt,
        category: 'RENDER',
        eventType: 'RENDER_FAILED',
        title: 'Render failed',
        description: job.error ?? 'Render job failed.',
        entityId: job.id,
        metadata: {
          retryCount,
          error: job.error,
        },
      }),
    );
  }

  if (retryCount > 0) {
    events.push(
      createAuditEvent({
        timestamp: job.updatedAt,
        category: 'RENDER',
        eventType: 'RENDER_RETRY_EVIDENCE',
        title: 'Retry evidence detected',
        description: `Stage 16C retry count encoding reports ${retryCount} prior attempt(s).`,
        entityId: job.id,
        metadata: { retryCount },
      }),
    );
  }

  return buildAuditTimeline({
    subjectId: renderJobId,
    subjectType: 'render',
    title: `Render job ${job.id}`,
    description: `Current status: ${job.status}`,
    events,
  });
}

export const renderAuditBuilder = {
  buildRenderAuditTimeline,
};
