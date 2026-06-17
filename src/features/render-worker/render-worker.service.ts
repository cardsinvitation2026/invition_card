import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { renderJobService } from '@/features/render-jobs';
import { userService } from '@/features/users';
import {
  parseRetryCount,
  recordJobFailure,
  runPreCycleMaintenance,
} from '@/features/render-reliability';
import { RENDER_WORKER_CONCURRENCY } from '@/features/render-worker/render-worker.constants';
import { renderWorkerLock } from '@/features/render-worker/render-worker.lock';
import type { PendingRenderJob, RenderWorkerProcessResult } from '@/features/render-worker/render-worker.types';
import type { AuthSession } from '@/types/auth';
import type { RenderJobDetail } from '@/types/render-job';

const WORKER_LIST_SESSION: AuthSession = {
  userId: 'render-worker',
  firebaseUid: 'render-worker',
  email: 'render-worker@system',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  provider: 'dev',
};

export type RenderJobExecutor = (
  session: AuthSession,
  jobId: string,
) => Promise<RenderJobDetail>;

async function resolveDraftOwnerUserId(draftId: string): Promise<string | null> {
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const row = await prisma.draft.findUnique({
        where: { id: draftId },
        select: { userId: true },
      });
      return row?.userId ?? null;
    }
    return null;
  }

  const store = globalThis.__mi_inmem_drafts__ as
    | Map<string, { userId: string }>
    | undefined;
  const entry = store?.get(draftId);
  return entry?.userId ?? null;
}

async function buildOwnerSession(userId: string): Promise<AuthSession | null> {
  const user = await userService.getById(userId);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    role: user.role,
    status: user.status,
    provider: 'dev',
  };
}

export async function discoverPendingRenderJobs(): Promise<PendingRenderJob[]> {
  const result = await renderJobService.listRenderJobs(WORKER_LIST_SESSION, {
    page: 1,
    pageSize: 100,
    status: 'PENDING',
  });

  return [...result.items]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((job) => ({
      id: job.id,
      draftId: job.draftId,
      createdAt: job.createdAt,
    }));
}

export function createRenderWorkerService(executor: RenderJobExecutor) {
  return {
    async processPendingJobs(): Promise<RenderWorkerProcessResult> {
      await runPreCycleMaintenance();
      const pendingJobs = await discoverPendingRenderJobs();
      let processed = 0;

      for (const job of pendingJobs) {
        if (processed >= RENDER_WORKER_CONCURRENCY) {
          break;
        }

        const claimed = await renderJobService.claimPendingRenderJob(job.id);
        if (!claimed) {
          continue;
        }

        if (!renderWorkerLock.tryClaim(job.id)) {
          continue;
        }

        try {
          const ownerUserId = await resolveDraftOwnerUserId(job.draftId);
          if (!ownerUserId) {
            console.error(`Render worker skipped job ${job.id}: draft owner not found`);
            await renderJobService.updateRenderJobStatus(job.id, {
              status: 'FAILED',
              error: 'Draft owner not found',
              completedAt: new Date().toISOString(),
            });
            continue;
          }

          const ownerSession = await buildOwnerSession(ownerUserId);
          if (!ownerSession) {
            console.error(`Render worker skipped job ${job.id}: owner session unavailable`);
            await renderJobService.updateRenderJobStatus(job.id, {
              status: 'FAILED',
              error: 'Owner session unavailable',
              completedAt: new Date().toISOString(),
            });
            continue;
          }

          const pendingDetail = await renderJobService.getRenderJob(
            WORKER_LIST_SESSION,
            job.id,
          );
          const priorRetryCount = parseRetryCount(pendingDetail?.error);

          const result = await executor(ownerSession, job.id);
          if (result.status === 'FAILED') {
            await recordJobFailure(result, priorRetryCount);
          }

          processed += 1;
          return {
            processed: true,
            jobId: job.id,
            skippedLocked: false,
          };
        } catch (error) {
          console.error(
            `Render worker failed job ${job.id}:`,
            error instanceof Error ? error.message : error,
          );
          return {
            processed: true,
            jobId: job.id,
            skippedLocked: false,
          };
        } finally {
          renderWorkerLock.release(job.id);
        }
      }

      return {
        processed: false,
        jobId: null,
        skippedLocked: pendingJobs.some((job) => renderWorkerLock.isLocked(job.id)),
      };
    },
  };
}

export const renderWorkerService = createRenderWorkerService(
  (session, jobId) => renderJobService.executeRenderJob(session, jobId),
);
