import 'server-only';
import type { MembershipRepository } from './membership.repository';
import type {
  MembershipCreateData,
  MembershipDetail,
  MembershipListQuery,
  MembershipStatus,
  MembershipUpdateData,
} from '@/types/membership-engine';
import type { MembershipPlanListItem } from '@/types/membership-plan';
import { toMembershipPlanListItem } from '@/features/membership-plans/seed';
import { getPrisma } from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toStatus(status: string): MembershipStatus {
  if (status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED') {
    return status;
  }
  return 'EXPIRED';
}

function toMembership(row: {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date;
  downloadsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}): Omit<MembershipDetail, 'plan'> {
  return {
    id: row.id,
    userId: row.userId,
    planId: row.planId,
    status: toStatus(row.status),
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    downloadsUsed: row.downloadsUsed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPlanListItem(plan: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  validityDays: number;
  downloadLimit: number | null;
  active: boolean;
  sortOrder: number;
}): MembershipPlanListItem {
  return toMembershipPlanListItem({
    ...plan,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  });
}

function buildWhere(query: MembershipListQuery, userId?: string) {
  return {
    ...(userId ? { userId } : {}),
    ...(!userId && query.userId ? { userId: query.userId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
}

export const prismaMembershipRepository: MembershipRepository = {
  async findById(id) {
    const row = await db().membership.findUnique({
      where: { id },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            validityDays: true,
            downloadLimit: true,
            active: true,
            sortOrder: true,
          },
        },
      },
    });
    if (!row) {
      return null;
    }
    return {
      ...toMembership(row),
      plan: row.plan ? toPlanListItem(row.plan) : null,
    };
  },

  async listByUser(userId, query) {
    const where = buildWhere(query, userId);
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      db().membership.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              currency: true,
              validityDays: true,
              downloadLimit: true,
              active: true,
              sortOrder: true,
            },
          },
        },
      }),
      db().membership.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        ...toMembership(row),
        plan: row.plan ? toPlanListItem(row.plan) : null,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async listAll(query) {
    const where = buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      db().membership.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              currency: true,
              validityDays: true,
              downloadLimit: true,
              active: true,
              sortOrder: true,
            },
          },
        },
      }),
      db().membership.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        ...toMembership(row),
        plan: row.plan ? toPlanListItem(row.plan) : null,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async create(input: MembershipCreateData) {
    const row = await db().membership.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        status: input.status,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        downloadsUsed: input.downloadsUsed,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            validityDays: true,
            downloadLimit: true,
            active: true,
            sortOrder: true,
          },
        },
      },
    });
    return {
      ...toMembership(row),
      plan: row.plan ? toPlanListItem(row.plan) : null,
    };
  },

  async update(id, input: MembershipUpdateData) {
    const row = await db().membership.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.downloadsUsed !== undefined ? { downloadsUsed: input.downloadsUsed } : {}),
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            validityDays: true,
            downloadLimit: true,
            active: true,
            sortOrder: true,
          },
        },
      },
    });
    return {
      ...toMembership(row),
      plan: row.plan ? toPlanListItem(row.plan) : null,
    };
  },

  async findActiveMemberships(userId) {
    const rows = await db().membership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            validityDays: true,
            downloadLimit: true,
            active: true,
            sortOrder: true,
          },
        },
      },
    });
    return rows.map((row) => ({
      ...toMembership(row),
      plan: row.plan ? toPlanListItem(row.plan) : null,
    }));
  },

  async countByUser(userId) {
    return db().membership.count({ where: { userId } });
  },
};

const planInclude = {
  plan: {
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      currency: true,
      validityDays: true,
      downloadLimit: true,
      active: true,
      sortOrder: true,
    },
  },
} as const;

export async function prismaMembershipCreateInTransaction(
  tx: Prisma.TransactionClient,
  input: MembershipCreateData,
): Promise<MembershipDetail> {
  const row = await tx.membership.create({
    data: {
      userId: input.userId,
      planId: input.planId,
      status: input.status,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      downloadsUsed: input.downloadsUsed,
    },
    include: planInclude,
  });
  return {
    ...toMembership(row),
    plan: row.plan ? toPlanListItem(row.plan) : null,
  };
}
