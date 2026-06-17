import 'server-only';
import type { MembershipPlanRepository } from './membership-plan.repository';
import { prismaMembershipPlanRepository } from './prisma-membership-plan.repository';
import { inMemoryMembershipPlanRepository } from './inmemory-membership-plan.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type {
  MembershipPlanCreateData,
  MembershipPlanListQuery,
  MembershipPlanUpdateData,
} from '@/types/membership-plan';
import type {
  MembershipPlanCreateInput,
  MembershipPlanListQueryInput,
  MembershipPlanUpdateInput,
} from '@/validations/membership-plan.validation';

function repo(): MembershipPlanRepository {
  return hasDatabaseUrl() ? prismaMembershipPlanRepository : inMemoryMembershipPlanRepository;
}

function toListQuery(input: MembershipPlanListQueryInput): MembershipPlanListQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    active: input.active,
  };
}

function toCreateData(input: MembershipPlanCreateInput): MembershipPlanCreateData {
  return {
    name: input.name,
    description: input.description,
    price: input.price,
    currency: input.currency,
    validityDays: input.validityDays,
    downloadLimit: input.downloadLimit,
    active: input.active,
    sortOrder: input.sortOrder,
  };
}

function toUpdateData(input: MembershipPlanUpdateInput): MembershipPlanUpdateData {
  const data: MembershipPlanUpdateData = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = input.price;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.validityDays !== undefined) data.validityDays = input.validityDays;
  if (input.downloadLimit !== undefined) data.downloadLimit = input.downloadLimit;
  if (input.active !== undefined) data.active = input.active;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  return data;
}

export const membershipPlanService = {
  async getPlan(id: string) {
    return repo().findById(id);
  },

  async getPlanByName(name: string) {
    return repo().findByName(name);
  },

  async listPlans(input: MembershipPlanListQueryInput) {
    return repo().list(toListQuery(input));
  },

  async listActivePlans() {
    return repo().listActivePlans();
  },

  async createPlan(input: MembershipPlanCreateInput) {
    return repo().create(toCreateData(input));
  },

  async updatePlan(id: string, input: MembershipPlanUpdateInput) {
    return repo().update(id, toUpdateData(input));
  },

  async softDeletePlan(id: string) {
    return repo().softDelete(id);
  },
};
