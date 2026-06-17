import type { PaymentStatus } from '@/types/payment';

export interface AdminPaymentListItem {
  id: string;
  paymentId: string;
  orderId: string;
  razorpayPaymentId: string | null;
  userName: string | null;
  userEmail: string;
  planId: string | null;
  planName: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  membershipId: string | null;
  membershipStatus: string | null;
}

export interface AdminPaymentDetail extends AdminPaymentListItem {
  razorpayOrderId: string | null;
  orderStatus: string;
  planPrice: number | null;
  planValidityDays: number | null;
  planDownloadLimit: number | null;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
}

export interface AdminPaymentSummary {
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  membershipSales: number;
}

export interface AdminPaymentListResult {
  items: AdminPaymentListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: AdminPaymentSummary;
}
