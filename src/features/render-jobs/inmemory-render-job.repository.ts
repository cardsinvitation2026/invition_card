import 'server-only';
import { randomUUID } from 'node:crypto';
import type { RenderJobRepository } from './render-job.repository';
import type {
  RenderJobDetail,
  RenderJobListQuery,
  RenderJobStatusUpdate,
} from '@/types/render-job';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_render_jobs__: Map<string, RenderJobDetail> | undefined;
}

type InMemoryDraft = {
  userId: string;
  templateId: string;
  status: string;
};

function jobStore(): Map<string, RenderJobDetail> {
  if (!globalThis.__mi_inmem_render_jobs__) {
    globalThis.__mi_inmem_render_jobs__ = new Map();
  }
  return globalThis.__mi_inmem_render_jobs__;
}

function draftStore(): Map<string, InMemoryDraft> | undefined {
  return globalThis.__mi_inmem_drafts__ as Map<string, InMemoryDraft> | undefined;
}

function isActiveDraft(draft: InMemoryDraft): boolean {
  return draft.status === 'ACTIVE';
}

function getDraftMeta(draftId: string): { userId: string; templateId: string } | null {
  const draft = draftStore()?.get(draftId);
  if (!draft || !isActiveDraft(draft)) {
    return null;
  }
  return { userId: draft.userId, templateId: draft.templateId };
}

function filterJobs(
  jobs: RenderJobDetail[],
  query: RenderJobListQuery,
  userId?: string,
): RenderJobDetail[] {
  let list = jobs;

  if (userId) {
    list = list.filter((job) => {
      const meta = getDraftMeta(job.draftId);
      return meta?.userId === userId;
    });
  }

  if (query.draftId) {
    list = list.filter((job) => job.draftId === query.draftId);
  }

  if (query.status) {
    list = list.filter((job) => job.status === query.status);
  }

  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

function paginate(list: RenderJobDetail[], query: RenderJobListQuery) {
  const total = list.length;
  const skip = (query.page - 1) * query.pageSize;
  const items = list.slice(skip, skip + query.pageSize);
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function applyStatusUpdate(job: RenderJobDetail, update: RenderJobStatusUpdate): RenderJobDetail {
  const now = new Date().toISOString();
  return {
    ...job,
    status: update.status,
    ...(update.previewUrl !== undefined ? { previewUrl: update.previewUrl } : {}),
    ...(update.finalUrl !== undefined ? { finalUrl: update.finalUrl } : {}),
    ...(update.error !== undefined ? { error: update.error } : {}),
    ...(update.attempt !== undefined ? { attempt: update.attempt } : {}),
    ...(update.startedAt !== undefined ? { startedAt: update.startedAt } : {}),
    ...(update.completedAt !== undefined ? { completedAt: update.completedAt } : {}),
    updatedAt: now,
  };
}

const claimLocks = new Map<string, Promise<void>>();

async function withClaimLock<T>(jobId: string, operation: () => Promise<T>): Promise<T> {
  const previous = claimLocks.get(jobId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chain = previous.then(() => gate);
  claimLocks.set(jobId, chain);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (claimLocks.get(jobId) === chain) {
      claimLocks.delete(jobId);
    }
  }
}

export const inMemoryRenderJobRepository: RenderJobRepository = {
  async create(input) {
    const meta = getDraftMeta(input.draftId);
    if (!meta) {
      throw new Error('Draft not found');
    }

    const now = new Date().toISOString();
    const created: RenderJobDetail = {
      id: randomUUID(),
      draftId: input.draftId,
      templateId: meta.templateId,
      status: 'PENDING',
      previewUrl: null,
      finalUrl: null,
      error: null,
      attempt: 1,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    jobStore().set(created.id, created);
    return created;
  },

  async findById(id) {
    return jobStore().get(id) ?? null;
  },

  async findByIdForUser(id, userId) {
    const job = jobStore().get(id);
    if (!job) {
      return null;
    }
    const meta = getDraftMeta(job.draftId);
    if (!meta || meta.userId !== userId) {
      return null;
    }
    return job;
  },

  async listByUser(userId, query) {
    const jobs = [...jobStore().values()];
    const filtered = filterJobs(jobs, query, userId);
    return paginate(filtered, query);
  },

  async listAll(query) {
    const jobs = [...jobStore().values()];
    const filtered = filterJobs(jobs, query);
    return paginate(filtered, query);
  },

  async updateStatus(id, update) {
    const existing = jobStore().get(id);
    if (!existing) {
      throw new Error('Render job not found');
    }
    const updated = applyStatusUpdate(existing, update);
    jobStore().set(id, updated);
    return updated;
  },

  async claimPending(id) {
    return withClaimLock(id, async () => {
      const existing = jobStore().get(id);
      if (!existing || existing.status !== 'PENDING') {
        return false;
      }
      const now = new Date().toISOString();
      jobStore().set(id, {
        ...existing,
        status: 'PROCESSING',
        startedAt: now,
        error: null,
        updatedAt: now,
      });
      return true;
    });
  },
};
