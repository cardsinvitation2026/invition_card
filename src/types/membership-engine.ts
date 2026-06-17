import type { MembershipPlanListItem } from '@/types/membership-plan';

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  downloadsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipDetail extends Membership {
  plan: MembershipPlanListItem | null;
}

export interface MembershipListQuery {
  page: number;
  pageSize: number;
  userId?: string;
  status?: MembershipStatus;
}

export interface MembershipListResult {
  items: MembershipDetail[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface MembershipCreateData {
  userId: string;
  planId: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  downloadsUsed: number;
}

export interface MembershipUpdateData {
  status?: MembershipStatus;
  downloadsUsed?: number;
}

export interface MembershipSummary {
  hasMembership: boolean;
  activeMembershipCount: number;
  memberships: MembershipDetail[];
}

export interface ActiveMembershipResult {
  memberships: MembershipDetail[];
}

export interface MembershipEntitlementResult {
  hasMembership: boolean;
  activeMembershipCount: number;
  unlimitedDownloads: boolean;
  remainingDownloads: number | null;
}

export interface RemainingDownloadsPerMembership {
  membershipId: string;
  planId: string;
  planName: string;
  downloadLimit: number | null;
  downloadsUsed: number;
  remaining: number | null;
}

export interface RemainingDownloadsResult {
  unlimited: boolean;
  remainingDownloads: number | null;
  perMembership: RemainingDownloadsPerMembership[];
}

export interface MembershipMeResponse {
  summary: MembershipSummary;
  remainingDownloads: RemainingDownloadsResult;
  activeMemberships: MembershipDetail[];
}
