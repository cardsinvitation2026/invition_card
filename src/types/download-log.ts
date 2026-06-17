export interface DownloadLog {
  id: string;
  userId: string;
  draftId: string;
  membershipId: string;
  downloadType: string | null;
  fileUrl: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  downloadedAt: string;
  createdAt: string;
}

export interface DownloadLogCreateData {
  userId: string;
  draftId: string;
  membershipId: string;
  downloadType?: string | null;
  fileUrl?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface DownloadLogListQuery {
  page: number;
  pageSize: number;
}

export interface DownloadLogPageResult {
  items: DownloadLog[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface DownloadLogListItem extends DownloadLog {
  templateId: string | null;
  templateName: string | null;
  membershipPlanName: string | null;
  hasVideo?: boolean;
}

export interface DownloadLogListResult {
  items: DownloadLogListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ExecuteDownloadResult {
  url: string;
  expiresAt: string;
  downloadLogId: string;
}
