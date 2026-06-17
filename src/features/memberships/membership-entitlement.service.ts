import 'server-only';
import type {
  MembershipDetail,
  MembershipEntitlementResult,
  MembershipSummary,
  RemainingDownloadsResult,
} from '@/types/membership-engine';

export function buildMembershipSummary(
  activeMemberships: MembershipDetail[],
): MembershipSummary {
  return {
    hasMembership: activeMemberships.length > 0,
    activeMembershipCount: activeMemberships.length,
    memberships: activeMemberships,
  };
}

export function calculateRemainingDownloadsFromMemberships(
  activeMemberships: MembershipDetail[],
): RemainingDownloadsResult {
  const perMembership = activeMemberships.map((membership) => {
    const downloadLimit = membership.plan?.downloadLimit ?? null;
    const remaining =
      downloadLimit === null ? null : Math.max(0, downloadLimit - membership.downloadsUsed);

    return {
      membershipId: membership.id,
      planId: membership.planId,
      planName: membership.plan?.name ?? '',
      downloadLimit,
      downloadsUsed: membership.downloadsUsed,
      remaining,
    };
  });

  const unlimited = perMembership.some((entry) => entry.downloadLimit === null);

  if (unlimited) {
    return {
      unlimited: true,
      remainingDownloads: null,
      perMembership,
    };
  }

  const remainingDownloads = perMembership.reduce(
    (sum, entry) => sum + (entry.remaining ?? 0),
    0,
  );

  return {
    unlimited: false,
    remainingDownloads,
    perMembership,
  };
}

export function buildMembershipEntitlement(
  activeMemberships: MembershipDetail[],
): MembershipEntitlementResult {
  const remaining = calculateRemainingDownloadsFromMemberships(activeMemberships);

  return {
    hasMembership: activeMemberships.length > 0,
    activeMembershipCount: activeMemberships.length,
    unlimitedDownloads: remaining.unlimited,
    remainingDownloads: remaining.remainingDownloads,
  };
}
