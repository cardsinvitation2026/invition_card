import 'server-only';
import type { Order } from '@/types/order';
import type {
  AdminPaymentListItem,
  AdminPaymentListResult,
  AdminPaymentSummary,
} from '@/types/admin-payment';
import type { AdminPaymentListQueryInput } from '@/validations/admin-payment.validation';
import {
  buildAdminPaymentRows,
  fetchAllOrders,
  matchesPaymentSearch,
} from '@/lib/admin/payment-enrichment';
import { sumSuccessfulPaymentAmounts } from '@/lib/admin/revenue';

function computeSummary(rows: AdminPaymentListItem[], orders: Order[]): AdminPaymentSummary {
  let successfulPayments = 0;
  let pendingPayments = 0;
  let failedPayments = 0;

  for (const row of rows) {
    if (row.status === 'SUCCESS') {
      successfulPayments += 1;
    } else if (row.status === 'PENDING') {
      pendingPayments += 1;
    } else if (row.status === 'FAILED') {
      failedPayments += 1;
    }
  }

  const totalRevenue = sumSuccessfulPaymentAmounts(rows);

  const membershipSales = orders.filter(
    (order) => order.status === 'COMPLETED' && order.membershipId !== null,
  ).length;

  return {
    totalRevenue,
    successfulPayments,
    pendingPayments,
    failedPayments,
    membershipSales,
  };
}

export async function listAdminPayments(
  input: AdminPaymentListQueryInput,
): Promise<AdminPaymentListResult> {
  const orders = await fetchAllOrders();
  const allRows = await buildAdminPaymentRows(orders);
  const summary = computeSummary(allRows, orders);

  let filtered = allRows;

  if (input.status) {
    filtered = filtered.filter((row) => row.status === input.status);
  }
  if (input.planId) {
    filtered = filtered.filter((row) => row.planId === input.planId);
  }
  if (input.search) {
    filtered = filtered.filter((row) => matchesPaymentSearch(row, input.search!));
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
