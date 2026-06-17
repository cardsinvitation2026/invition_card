import type { MembershipStatus } from '@/types/membership-engine';

export interface AdminMembershipListItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  planId: string;
  planName: string;
  status: MembershipStatus;
  downloadsUsed: number;
  downloadLimit: number | null;
  remainingDownloads: number | null;
  remainingLabel: string;
  startDate: string;
  endDate: string;
}

export interface AdminMembershipSummary {
  totalMemberships: number;
  activeMemberships: number;
  expiredMemberships: number;
  cancelledMemberships: number;
  downloadsConsumed: number;
}

export interface AdminMembershipListResult {
  items: AdminMembershipListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: AdminMembershipSummary;
}

export interface AdminMembershipRecentDownload {
  id: string;
  downloadedAt: string;
  draftId: string;
  draftTitle: string | null;
  templateName: string | null;
  downloadType: string | null;
  fileUrl: string | null;
}

export interface AdminMembershipDetail {
  id: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  planId: string;
  planName: string;
  planPrice: number;
  planCurrency: string;
  planValidityDays: number;
  planDownloadLimit: number | null;
  planDescription: string | null;
  downloadsUsed: number;
  downloadLimit: number | null;
  remainingDownloads: number | null;
  remainingLabel: string;
  usagePercentage: number | null;
  recentDownloads: AdminMembershipRecentDownload[];
}
