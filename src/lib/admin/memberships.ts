import 'server-only';
import type {
  AdminMembershipListResult,
  AdminMembershipSummary,
} from '@/types/admin-membership';
import type { AdminMembershipListQueryInput } from '@/validations/admin-membership.validation';
import {
  buildAdminMembershipListItems,
  fetchAllMemberships,
  matchesMembershipSearch,
  resolveMembershipUsers,
} from '@/lib/admin/membership-enrichment';
import type { MembershipDetail } from '@/types/membership-engine';

function computeSummary(memberships: MembershipDetail[]): AdminMembershipSummary {
  let activeMemberships = 0;
  let expiredMemberships = 0;
  let cancelledMemberships = 0;
  let downloadsConsumed = 0;

  for (const membership of memberships) {
    downloadsConsumed += membership.downloadsUsed;
    if (membership.status === 'ACTIVE') {
      activeMemberships += 1;
    } else if (membership.status === 'EXPIRED') {
      expiredMemberships += 1;
    } else if (membership.status === 'CANCELLED') {
      cancelledMemberships += 1;
    }
  }

  return {
    totalMemberships: memberships.length,
    activeMemberships,
    expiredMemberships,
    cancelledMemberships,
    downloadsConsumed,
  };
}

export async function listAdminMemberships(
  input: AdminMembershipListQueryInput,
): Promise<AdminMembershipListResult> {
  const allMemberships = await fetchAllMemberships();
  const summary = computeSummary(allMemberships);
  const users = await resolveMembershipUsers(allMemberships.map((membership) => membership.userId));
  const allItems = buildAdminMembershipListItems(allMemberships, users);

  let filtered = allItems;

  if (input.status) {
    filtered = filtered.filter((item) => item.status === input.status);
  }
  if (input.planId) {
    filtered = filtered.filter((item) => item.planId === input.planId);
  }
  if (input.search) {
    filtered = filtered.filter((item) => matchesMembershipSearch(item, input.search!));
  }

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / input.pageSize));
  const skip = (input.page - 1) * input.pageSize;
  const items = filtered.slice(skip, skip + input.pageSize);

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    pageCount,
    summary,
  };
}
