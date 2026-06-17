import 'server-only';
import type { DownloadLogRepository } from './download-log.repository';
import type {
  DownloadLog,
  DownloadLogCreateData,
  DownloadLogListQuery,
} from '@/types/download-log';
import { getPrisma } from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import { DownloadLogQuotaError } from './download-log.errors';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toDownloadLog(row: {
  id: string;
  userId: string;
  draftId: string;
  membershipId: string;
  downloadType: string | null;
  fileUrl: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  downloadedAt: Date;
  createdAt: Date;
}): DownloadLog {
  return {
    id: row.id,
    userId: row.userId,
    draftId: row.draftId,
    membershipId: row.membershipId,
    downloadType: row.downloadType,
    fileUrl: row.fileUrl,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    downloadedAt: row.downloadedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

async function listLogs(userId: string, query: DownloadLogListQuery) {
  const where = { userId };
  const skip = (query.page - 1) * query.pageSize;
  const [rows, total] = await Promise.all([
    db().downloadLog.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { downloadedAt: 'desc' },
    }),
    db().downloadLog.count({ where }),
  ]);

  return {
    items: rows.map(toDownloadLog),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

async function createLog(
  client: Prisma.TransactionClient | ReturnType<typeof db>,
  input: DownloadLogCreateData,
): Promise<DownloadLog> {
  const row = await client.downloadLog.create({
    data: {
      userId: input.userId,
      draftId: input.draftId,
      membershipId: input.membershipId,
      downloadType: input.downloadType ?? 'video',
      fileUrl: input.fileUrl ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
  return toDownloadLog(row);
}

export const prismaDownloadLogRepository: DownloadLogRepository = {
  async findById(id) {
    const row = await db().downloadLog.findUnique({ where: { id } });
    return row ? toDownloadLog(row) : null;
  },

  async findByIdForUser(id, userId) {
    const row = await db().downloadLog.findFirst({
      where: { id, userId },
    });
    return row ? toDownloadLog(row) : null;
  },

  async listByUser(userId, query) {
    return listLogs(userId, query);
  },

  async create(input) {
    return createLog(db(), input);
  },

  async recordDownloadWithQuotaConsumption(input) {
    return db().$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: input.membershipId },
        include: {
          plan: {
            select: { downloadLimit: true },
          },
        },
      });

      if (!membership || membership.userId !== input.userId) {
        throw new Error('Membership not found');
      }

      if (membership.status !== 'ACTIVE') {
        throw new DownloadLogQuotaError();
      }

      const downloadLimit = membership.plan.downloadLimit;

      if (downloadLimit === null) {
        await tx.membership.update({
          where: { id: input.membershipId },
          data: { downloadsUsed: { increment: 1 } },
        });
      } else {
        const updated = await tx.membership.updateMany({
          where: {
            id: input.membershipId,
            userId: input.userId,
            status: 'ACTIVE',
            downloadsUsed: { lt: downloadLimit },
          },
          data: { downloadsUsed: { increment: 1 } },
        });

        if (updated.count === 0) {
          throw new DownloadLogQuotaError();
        }
      }

      return createLog(tx, input);
    });
  },
};
