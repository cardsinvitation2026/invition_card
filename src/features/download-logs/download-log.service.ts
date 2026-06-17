import 'server-only';
import type { DownloadLogRepository } from './download-log.repository';
import { prismaDownloadLogRepository } from './prisma-download-log.repository';
import { inMemoryDownloadLogRepository } from './inmemory-download-log.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { membershipService } from '@/features/memberships';
import { draftService } from '@/features/drafts';
import { templateService } from '@/features/templates';
import type {
  DownloadLogCreateData,
  DownloadLogListItem,
  DownloadLogListQuery,
} from '@/types/download-log';
import type { DownloadLogListQueryInput } from '@/validations/download-log.validation';

function repo(): DownloadLogRepository {
  return hasDatabaseUrl() ? prismaDownloadLogRepository : inMemoryDownloadLogRepository;
}

async function enrichLog(log: Awaited<ReturnType<DownloadLogRepository['findById']>>) {
  if (!log) {
    return null;
  }

  const draft = await draftService.getDraft(log.userId, log.draftId);
  const membership = await membershipService.getMembership(log.membershipId);
  const template = draft ? await templateService.getTemplate(draft.draft.templateId) : null;

  const item: DownloadLogListItem = {
    ...log,
    templateId: draft?.draft.templateId ?? null,
    templateName: template?.name ?? null,
    membershipPlanName: membership?.plan?.name ?? null,
  };
  return item;
}

export const downloadLogService = {
  async getDownloadLog(id: string) {
    return repo().findById(id);
  },

  async getDownloadLogForUser(id: string, userId: string) {
    return repo().findByIdForUser(id, userId);
  },

  async listByUser(userId: string, input: DownloadLogListQueryInput) {
    const query: DownloadLogListQuery = {
      page: input.page,
      pageSize: input.pageSize,
    };
    const result = await repo().listByUser(userId, query);
    const items = (
      await Promise.all(result.items.map((log) => enrichLog(log)))
    ).filter((item): item is DownloadLogListItem => item !== null);

    return {
      ...result,
      items,
    };
  },

  async createDownloadLog(input: DownloadLogCreateData) {
    return repo().create(input);
  },

  async recordDownloadWithQuotaConsumption(input: DownloadLogCreateData) {
    return repo().recordDownloadWithQuotaConsumption(input);
  },
};
