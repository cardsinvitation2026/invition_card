import 'server-only';
import { randomUUID } from 'node:crypto';
import type { MembershipPlanRepository } from './membership-plan.repository';
import type {
  MembershipPlan,
  MembershipPlanCreateData,
  MembershipPlanDetail,
  MembershipPlanListQuery,
  MembershipPlanUpdateData,
} from '@/types/membership-plan';
import { seedMembershipPlans, toMembershipPlanListItem } from './seed';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_membership_plans__: Map<string, MembershipPlan> | undefined;
}

function store(): Map<string, MembershipPlan> {
  if (!globalThis.__mi_inmem_membership_plans__) {
    const map = new Map<string, MembershipPlan>();
    for (const plan of seedMembershipPlans) {
      map.set(plan.id, { ...plan });
    }
    globalThis.__mi_inmem_membership_plans__ = map;
  }
  return globalThis.__mi_inmem_membership_plans__;
}

function notDeleted(plan: MembershipPlan): boolean {
  return plan.deletedAt === null;
}

function sorted(plans: MembershipPlan[]): MembershipPlan[] {
  return plans
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

function paginate<T>(list: T[], query: MembershipPlanListQuery) {
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

export const inMemoryMembershipPlanRepository: MembershipPlanRepository = {
  async findById(id) {
    const plan = store().get(id);
    if (!plan || !notDeleted(plan)) {
      return null;
    }
    return { ...plan };
  },

  async findByName(name) {
    const plan = [...store().values()].find((p) => p.name === name && notDeleted(p));
    return plan ? { ...plan } : null;
  },

  async list(query) {
    let plans = [...store().values()].filter(notDeleted);
    if (query.active !== undefined) {
      plans = plans.filter((p) => p.active === query.active);
    }
    const sortedPlans = sorted(plans);
    const page = paginate(sortedPlans, query);
    return {
      ...page,
      items: page.items.map(toMembershipPlanListItem),
    };
  },

  async create(input: MembershipPlanCreateData) {
    const now = new Date().toISOString();
    const created: MembershipPlanDetail = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      currency: input.currency,
      validityDays: input.validityDays,
      downloadLimit: input.downloadLimit ?? null,
      active: input.active,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    store().set(created.id, created);
    return { ...created };
  },

  async update(id, input: MembershipPlanUpdateData) {
    const existing = store().get(id);
    if (!existing || !notDeleted(existing)) {
      throw new Error('Membership plan not found');
    }
    const now = new Date().toISOString();
    const updated: MembershipPlanDetail = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.validityDays !== undefined ? { validityDays: input.validityDays } : {}),
      ...(input.downloadLimit !== undefined ? { downloadLimit: input.downloadLimit } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: now,
    };
    store().set(id, updated);
    return { ...updated };
  },

  async softDelete(id) {
    const existing = store().get(id);
    if (!existing || !notDeleted(existing)) {
      throw new Error('Membership plan not found');
    }
    const now = new Date().toISOString();
    store().set(id, {
      ...existing,
      active: false,
      deletedAt: now,
      updatedAt: now,
    });
  },

  async listActivePlans() {
    return sorted([...store().values()].filter((p) => p.active && notDeleted(p))).map(
      toMembershipPlanListItem,
    );
  },
};
