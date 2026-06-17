import 'server-only';
import { randomUUID } from 'node:crypto';
import type { DownloadLogRepository } from './download-log.repository';
import type { DownloadLog, DownloadLogListQuery } from '@/types/download-log';
import { DownloadLogQuotaError } from '@/features/download-logs/download-log.errors';
import { inMemoryMembershipRepository } from '@/features/memberships/inmemory-membership.repository';
import { inMemoryMembershipPlanRepository } from '@/features/membership-plans/inmemory-membership-plan.repository';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_download_logs__: Map<string, DownloadLog> | undefined;
}

const membershipConsumptionLocks = new Map<string, Promise<void>>();

function store(): Map<string, DownloadLog> {
  if (!globalThis.__mi_inmem_download_logs__) {
    globalThis.__mi_inmem_download_logs__ = new Map();
  }
  return globalThis.__mi_inmem_download_logs__;
}

async function withMembershipConsumptionLock<T>(
  membershipId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = membershipConsumptionLocks.get(membershipId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chain = previous.then(() => gate);
  membershipConsumptionLocks.set(membershipId, chain);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (membershipConsumptionLocks.get(membershipId) === chain) {
      membershipConsumptionLocks.delete(membershipId);
    }
  }
}

function paginate<T>(list: T[], query: DownloadLogListQuery) {
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

async function assertMembershipQuotaAvailable(
  membershipId: string,
  userId: string,
): Promise<{ downloadsUsed: number }> {
  const membership = await inMemoryMembershipRepository.findById(membershipId);
  if (!membership || membership.userId !== userId) {
    throw new Error('Membership not found');
  }

  if (membership.status !== 'ACTIVE') {
    throw new DownloadLogQuotaError();
  }

  const plan = await inMemoryMembershipPlanRepository.findById(membership.planId);
  const downloadLimit = plan?.downloadLimit ?? null;

  if (downloadLimit !== null && membership.downloadsUsed >= downloadLimit) {
    throw new DownloadLogQuotaError();
  }

  return { downloadsUsed: membership.downloadsUsed };
}

export const inMemoryDownloadLogRepository: DownloadLogRepository = {
  async findById(id) {
    return store().get(id) ?? null;
  },

  async findByIdForUser(id, userId) {
    const log = store().get(id);
    if (!log || log.userId !== userId) {
      return null;
    }
    return log;
  },

  async listByUser(userId, query) {
    const logs = [...store().values()]
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
    return paginate(logs, query);
  },

  async create(input) {
    const now = new Date().toISOString();
    const created: DownloadLog = {
      id: randomUUID(),
      userId: input.userId,
      draftId: input.draftId,
      membershipId: input.membershipId,
      downloadType: input.downloadType ?? null,
      fileUrl: input.fileUrl ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      downloadedAt: now,
      createdAt: now,
    };
    store().set(created.id, created);
    return created;
  },

  async recordDownloadWithQuotaConsumption(input) {
    return withMembershipConsumptionLock(input.membershipId, async () => {
      const snapshot = await assertMembershipQuotaAvailable(input.membershipId, input.userId);

      const created = await this.create(input);
      try {
        await inMemoryMembershipRepository.update(input.membershipId, {
          downloadsUsed: snapshot.downloadsUsed + 1,
        });
        return created;
      } catch (error) {
        store().delete(created.id);
        throw error;
      }
    });
  },
};
