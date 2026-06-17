import 'server-only';
import { randomUUID } from 'node:crypto';
import type { MembershipRepository } from './membership.repository';
import type {
  Membership,
  MembershipCreateData,
  MembershipDetail,
  MembershipListQuery,
  MembershipStatus,
  MembershipUpdateData,
} from '@/types/membership-engine';
import type { MembershipPlanListItem } from '@/types/membership-plan';
import { inMemoryMembershipPlanRepository } from '@/features/membership-plans/inmemory-membership-plan.repository';
import { toMembershipPlanListItem } from '@/features/membership-plans/seed';
import type { MembershipPlan } from '@/types/membership-plan';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_memberships__: Map<string, Membership> | undefined;
}

function store(): Map<string, Membership> {
  if (!globalThis.__mi_inmem_memberships__) {
    globalThis.__mi_inmem_memberships__ = new Map();
  }
  return globalThis.__mi_inmem_memberships__;
}

function toStatus(status: string): MembershipStatus {
  if (status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED') {
    return status;
  }
  return 'EXPIRED';
}

async function resolvePlan(planId: string): Promise<MembershipPlanListItem | null> {
  const plan = await inMemoryMembershipPlanRepository.findById(planId);
  return plan ? toMembershipPlanListItem(plan as MembershipPlan) : null;
}

function toDetail(membership: Membership, plan: MembershipPlanListItem | null): MembershipDetail {
  return { ...membership, plan };
}

function filterMemberships(
  memberships: Membership[],
  query: MembershipListQuery,
  userId?: string,
): Membership[] {
  let list = memberships;
  if (userId) {
    list = list.filter((m) => m.userId === userId);
  } else if (query.userId) {
    list = list.filter((m) => m.userId === query.userId);
  }
  if (query.status) {
    list = list.filter((m) => m.status === query.status);
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

function paginate(list: Membership[], query: MembershipListQuery) {
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

export const inMemoryMembershipRepository: MembershipRepository = {
  async findById(id) {
    const membership = store().get(id);
    if (!membership) {
      return null;
    }
    const plan = await resolvePlan(membership.planId);
    return toDetail(membership, plan);
  },

  async listByUser(userId, query) {
    const filtered = filterMemberships([...store().values()], query, userId);
    const page = paginate(filtered, query);
    const items = await Promise.all(
      page.items.map(async (m) => toDetail(m, await resolvePlan(m.planId))),
    );
    return { ...page, items };
  },

  async listAll(query) {
    const filtered = filterMemberships([...store().values()], query);
    const page = paginate(filtered, query);
    const items = await Promise.all(
      page.items.map(async (m) => toDetail(m, await resolvePlan(m.planId))),
    );
    return { ...page, items };
  },

  async create(input: MembershipCreateData) {
    const now = new Date().toISOString();
    const created: Membership = {
      id: randomUUID(),
      userId: input.userId,
      planId: input.planId,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      downloadsUsed: input.downloadsUsed,
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    const plan = await resolvePlan(created.planId);
    return toDetail(created, plan);
  },

  async update(id, input: MembershipUpdateData) {
    const existing = store().get(id);
    if (!existing) {
      throw new Error('Membership not found');
    }
    const now = new Date().toISOString();
    const updated: Membership = {
      ...existing,
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.downloadsUsed !== undefined ? { downloadsUsed: input.downloadsUsed } : {}),
      updatedAt: now,
    };
    store().set(id, updated);
    const plan = await resolvePlan(updated.planId);
    return toDetail(updated, plan);
  },

  async findActiveMemberships(userId) {
    const active = [...store().values()].filter(
      (m) => m.userId === userId && m.status === 'ACTIVE',
    );
    return Promise.all(
      active.map(async (m) => toDetail(m, await resolvePlan(m.planId))),
    );
  },

  async countByUser(userId) {
    return [...store().values()].filter((m) => m.userId === userId).length;
  },
};
