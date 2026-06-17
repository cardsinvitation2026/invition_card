import 'server-only';
import type { MembershipRepository } from './membership.repository';
import { prismaMembershipRepository } from './prisma-membership.repository';
import { inMemoryMembershipRepository } from './inmemory-membership.repository';
import { membershipPlanService } from '@/features/membership-plans';
import { userService } from '@/features/users';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { expireMembershipsIfNeeded } from './membership-expiry.service';
import {
  buildMembershipEntitlement,
  buildMembershipSummary,
  calculateRemainingDownloadsFromMemberships,
} from './membership-entitlement.service';
import type {
  ActiveMembershipResult,
  MembershipCreateData,
  MembershipListQuery,
  MembershipMeResponse,
} from '@/types/membership-engine';
import type {
  MembershipCreateInput,
  MembershipListQueryInput,
  MembershipUpdateInput,
} from '@/validations/membership.validation';
import type { Prisma } from '@prisma/client';
import { prismaMembershipCreateInTransaction } from './prisma-membership.repository';

function repo(): MembershipRepository {
  return hasDatabaseUrl() ? prismaMembershipRepository : inMemoryMembershipRepository;
}

function toListQuery(input: MembershipListQueryInput): MembershipListQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    userId: input.userId,
    status: input.status,
  };
}

function computeEndDate(startDate: Date, validityDays: number): string {
  const end = new Date(startDate);
  end.setUTCDate(end.getUTCDate() + validityDays);
  return end.toISOString();
}

async function prepareMembershipCreateData(
  input: MembershipCreateInput,
): Promise<MembershipCreateData> {
  const user = await userService.getById(input.userId);
  if (!user) {
    throw new Error('User not found');
  }

  const plan = await membershipPlanService.getPlan(input.planId);
  if (!plan) {
    throw new Error('Membership plan not found');
  }
  if (!plan.active) {
    throw new Error('Membership plan is not active');
  }

  const startDate = new Date();
  return {
    userId: input.userId,
    planId: input.planId,
    status: 'ACTIVE',
    startDate: startDate.toISOString(),
    endDate: computeEndDate(startDate, plan.validityDays),
    downloadsUsed: 0,
  };
}

export const membershipService = {
  async getMembership(id: string) {
    return repo().findById(id);
  },

  async listMembershipsByUser(userId: string, input: MembershipListQueryInput) {
    return repo().listByUser(userId, toListQuery(input));
  },

  async listAllMemberships(input: MembershipListQueryInput) {
    return repo().listAll(toListQuery(input));
  },

  async createMembership(input: MembershipCreateInput) {
    const data = await prepareMembershipCreateData(input);
    return repo().create(data);
  },

  async createMembershipInTransaction(
    tx: Prisma.TransactionClient,
    input: MembershipCreateInput,
  ) {
    const data = await prepareMembershipCreateData(input);
    return prismaMembershipCreateInTransaction(tx, data);
  },

  async updateMembership(id: string, input: MembershipUpdateInput) {
    const existing = await repo().findById(id);
    if (!existing) {
      throw new Error('Membership not found');
    }
    return repo().update(id, { status: input.status });
  },

  async cancelMembership(id: string) {
    const existing = await repo().findById(id);
    if (!existing) {
      throw new Error('Membership not found');
    }
    return repo().update(id, { status: 'CANCELLED' });
  },

  async resolveActiveMembership(userId: string): Promise<ActiveMembershipResult> {
    const candidates = await repo().findActiveMemberships(userId);
    const memberships = await expireMembershipsIfNeeded(repo(), candidates);
    return { memberships };
  },

  async getMembershipSummary(userId: string) {
    const { memberships } = await this.resolveActiveMembership(userId);
    return buildMembershipSummary(memberships);
  },

  async calculateRemainingDownloads(userId: string) {
    const { memberships } = await this.resolveActiveMembership(userId);
    return calculateRemainingDownloadsFromMemberships(memberships);
  },

  async getMembershipEntitlement(userId: string) {
    const { memberships } = await this.resolveActiveMembership(userId);
    return buildMembershipEntitlement(memberships);
  },

  async getMembershipMe(userId: string): Promise<MembershipMeResponse> {
    const { memberships } = await this.resolveActiveMembership(userId);
    const summary = buildMembershipSummary(memberships);
    const remainingDownloads = calculateRemainingDownloadsFromMemberships(memberships);

    return {
      summary,
      remainingDownloads,
      activeMemberships: memberships,
    };
  },

  async countMembershipsByUser(userId: string) {
    return repo().countByUser(userId);
  },
};
