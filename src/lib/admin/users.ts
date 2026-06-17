import 'server-only';
import type { AdminUserListResult, AdminUserSummary } from '@/types/admin-user';
import type { AdminUserListQueryInput } from '@/validations/admin-user.validation';
import {
  buildAdminUserListItems,
  buildUserMetricsBundle,
  fetchAllUsers,
  matchesUserSearch,
} from '@/lib/admin/user-enrichment';
import {
  batchPaymentsByOrderIds,
  fetchAllOrders,
} from '@/lib/admin/payment-enrichment';
import { sumSuccessfulPaymentAmounts } from '@/lib/admin/revenue';

function computeSummary(
  items: ReturnType<typeof buildAdminUserListItems>,
  metrics: Awaited<ReturnType<typeof buildUserMetricsBundle>>,
  totalRevenue: number,
): AdminUserSummary {
  const activeMembers = items.filter((item) => item.activeMembershipCount > 0).length;
  return {
    totalUsers: items.length,
    activeMembers,
    totalRevenue,
    totalDrafts: metrics.totalDrafts,
    totalRenders: metrics.totalRenders,
  };
}

export async function listAdminUsers(
  input: AdminUserListQueryInput,
): Promise<AdminUserListResult> {
  const [users, metrics, orders] = await Promise.all([
    fetchAllUsers(),
    buildUserMetricsBundle(),
    fetchAllOrders(),
  ]);

  const payments = await batchPaymentsByOrderIds(orders.map((order) => order.id));
  const paymentRows = orders
    .map((order) => payments.get(order.id))
    .filter((payment): payment is NonNullable<typeof payment> => payment !== undefined);
  const totalRevenue = sumSuccessfulPaymentAmounts(paymentRows);

  const allItems = buildAdminUserListItems(users, metrics);
  const summary = computeSummary(allItems, metrics, totalRevenue);

  let filtered = allItems;

  if (input.role) {
    filtered = filtered.filter((item) => item.role === input.role);
  }
  if (input.membership === 'has_active') {
    filtered = filtered.filter((item) => item.activeMembershipCount > 0);
  } else if (input.membership === 'no_active') {
    filtered = filtered.filter((item) => item.activeMembershipCount === 0);
  }
  if (input.search) {
    filtered = filtered.filter((item) => matchesUserSearch(item, input.search!));
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
