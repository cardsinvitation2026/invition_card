import 'server-only';
import type { RenderJobRepository } from './render-job.repository';
import type {
  RenderJobDetail,
  RenderJobListQuery,
  RenderJobStatus,
} from '@/types/render-job';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toStatus(status: string): RenderJobStatus {
  if (
    status === 'PENDING' ||
    status === 'PROCESSING' ||
    status === 'COMPLETED' ||
    status === 'FAILED'
  ) {
    return status;
  }
  return 'PENDING';
}

function toDetail(row: {
  id: string;
  draftId: string;
  status: string;
  previewUrl: string | null;
  finalUrl: string | null;
  error: string | null;
  attempt: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  draft: { templateId: string };
}): RenderJobDetail {
  return {
    id: row.id,
    draftId: row.draftId,
    templateId: row.draft.templateId,
    status: toStatus(row.status),
    previewUrl: row.previewUrl,
    finalUrl: row.finalUrl,
    error: row.error,
    attempt: row.attempt,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(query: RenderJobListQuery, userId?: string) {
  return {
    ...(userId
      ? {
          draft: {
            userId,
            deletedAt: null,
            status: 'ACTIVE',
          },
        }
      : {}),
    ...(query.draftId ? { draftId: query.draftId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
}

async function listJobs(where: ReturnType<typeof buildWhere>, query: RenderJobListQuery) {
  const skip = (query.page - 1) * query.pageSize;
  const [rows, total] = await Promise.all([
    db().renderJob.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        draft: { select: { templateId: true } },
      },
    }),
    db().renderJob.count({ where }),
  ]);

  return {
    items: rows.map(toDetail),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export const prismaRenderJobRepository: RenderJobRepository = {
  async create(input) {
    const row = await db().renderJob.create({
      data: {
        draftId: input.draftId,
        status: 'PENDING',
      },
      include: {
        draft: { select: { templateId: true } },
      },
    });
    return toDetail(row);
  },

  async findById(id) {
    const row = await db().renderJob.findUnique({
      where: { id },
      include: {
        draft: { select: { templateId: true } },
      },
    });
    return row ? toDetail(row) : null;
  },

  async findByIdForUser(id, userId) {
    const row = await db().renderJob.findFirst({
      where: {
        id,
        draft: {
          userId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      },
      include: {
        draft: { select: { templateId: true } },
      },
    });
    return row ? toDetail(row) : null;
  },

  async listByUser(userId, query) {
    return listJobs(buildWhere(query, userId), query);
  },

  async listAll(query) {
    return listJobs(buildWhere(query), query);
  },

  async updateStatus(id, update) {
    const row = await db().renderJob.update({
      where: { id },
      data: {
        status: update.status,
        ...(update.previewUrl !== undefined ? { previewUrl: update.previewUrl } : {}),
        ...(update.finalUrl !== undefined ? { finalUrl: update.finalUrl } : {}),
        ...(update.error !== undefined ? { error: update.error } : {}),
        ...(update.attempt !== undefined ? { attempt: update.attempt } : {}),
        ...(update.startedAt !== undefined
          ? { startedAt: update.startedAt ? new Date(update.startedAt) : null }
          : {}),
        ...(update.completedAt !== undefined
          ? { completedAt: update.completedAt ? new Date(update.completedAt) : null }
          : {}),
      },
      include: {
        draft: { select: { templateId: true } },
      },
    });
    return toDetail(row);
  },

  async claimPending(id) {
    const result = await db().renderJob.updateMany({
      where: {
        id,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        error: null,
      },
    });
    return result.count === 1;
  },
};
