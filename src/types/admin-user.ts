import type { UserRole } from '@/types/user';

export interface AdminUserListItem {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  activeMembershipCount: number;
  draftCount: number;
  renderCount: number;
  downloadCount: number;
  lifetimeSpend: number;
  createdAt: string;
}

export interface AdminUserSummary {
  totalUsers: number;
  activeMembers: number;
  totalRevenue: number;
  totalDrafts: number;
  totalRenders: number;
}

export interface AdminUserListResult {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: AdminUserSummary;
}

export interface AdminUserMembershipItem {
  id: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  downloadsUsed: number;
  downloadLimit: number | null;
}

export interface AdminUserRecentDraft {
  id: string;
  title: string;
  createdAt: string;
}

export interface AdminUserRecentRender {
  id: string;
  status: string;
  createdAt: string;
}

export interface AdminUserRecentDownload {
  id: string;
  downloadedAt: string;
  downloadType: string | null;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  activeMemberships: AdminUserMembershipItem[];
  purchaseSummary: {
    totalPurchases: number;
    successfulPurchases: number;
    lifetimeSpend: number;
  };
  activitySummary: {
    draftCount: number;
    renderCount: number;
    downloadCount: number;
  };
  recentDrafts: AdminUserRecentDraft[];
  recentRenders: AdminUserRecentRender[];
  recentDownloads: AdminUserRecentDownload[];
}
