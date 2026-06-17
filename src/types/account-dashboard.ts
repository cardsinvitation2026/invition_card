export interface PurchaseHistoryItem {
  orderId: string;
  date: string;
  amount: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string | null;
  planName: string | null;
  membershipStatus: string | null;
  membershipId: string | null;
}

export interface PurchaseHistoryResult {
  items: PurchaseHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface DashboardDraftSummary {
  total: number;
  latestUpdatedAt: string | null;
  latestTemplateName: string | null;
}

export interface DashboardRenderSummary {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

export interface DashboardDownloadSummary {
  total: number;
  latestDownloadedAt: string | null;
  latestTemplateName: string | null;
}

export interface DashboardPurchaseSummary {
  total: number;
  latestPurchaseDate: string | null;
  latestPlanName: string | null;
}
