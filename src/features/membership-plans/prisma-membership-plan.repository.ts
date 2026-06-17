import 'server-only';
import type { MembershipPlanRepository } from './membership-plan.repository';
import type {
  MembershipPlanCreateData,
  MembershipPlanDetail,
  MembershipPlanListItem,
  MembershipPlanListQuery,
  MembershipPlanUpdateData,
} from '@/types/membership-plan';
function toListItem(row: {
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
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    validityDays: row.validityDays,
    downloadLimit: row.downloadLimit,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function notDeleted() {
  return { deletedAt: null };
}

function toDetail(row: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  validityDays: number;
  downloadLimit: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): MembershipPlanDetail {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    validityDays: row.validityDays,
    downloadLimit: row.downloadLimit,
    active: row.active,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

export const prismaMembershipPlanRepository: MembershipPlanRepository = {
  async findById(id) {
    const row = await db().membershipPlan.findFirst({
      where: { id, ...notDeleted() },
    });
    return row ? toDetail(row) : null;
  },

  async findByName(name) {
    const row = await db().membershipPlan.findFirst({
      where: { name, ...notDeleted() },
    });
    return row ? toDetail(row) : null;
  },

  async list(query: MembershipPlanListQuery) {
    const where = {
      ...notDeleted(),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      db().membershipPlan.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      db().membershipPlan.count({ where }),
    ]);
    return {
      items: rows.map(toListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async create(input: MembershipPlanCreateData) {
    const row = await db().membershipPlan.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        currency: input.currency,
        validityDays: input.validityDays,
        downloadLimit: input.downloadLimit ?? null,
        active: input.active,
        sortOrder: input.sortOrder,
      },
    });
    return toDetail(row);
  },

  async update(id, input: MembershipPlanUpdateData) {
    const row = await db().membershipPlan.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.validityDays !== undefined ? { validityDays: input.validityDays } : {}),
        ...(input.downloadLimit !== undefined ? { downloadLimit: input.downloadLimit } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return toDetail(row);
  },

  async softDelete(id) {
    await db().membershipPlan.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  },

  async listActivePlans() {
    const rows = await db().membershipPlan.findMany({
      where: { active: true, ...notDeleted() },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toListItem);
  },
};
