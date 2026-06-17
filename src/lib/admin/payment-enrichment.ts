import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { orderService } from '@/features/orders';
import { membershipService } from '@/features/memberships';
import { membershipPlanService } from '@/features/membership-plans';
import { userService } from '@/features/users';
import type { Order } from '@/types/order';
import type { Payment, PaymentStatus } from '@/types/payment';
import type { AdminPaymentListItem } from '@/types/admin-payment';

function toPaymentStatus(status: string): PaymentStatus {
  if (
    status === 'PENDING' ||
    status === 'SUCCESS' ||
    status === 'FAILED' ||
    status === 'REFUNDED'
  ) {
    return status;
  }
  return 'PENDING';
}

function toPayment(row: {
  id: string;
  orderId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  errorCode: string | null;
  errorDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    razorpaySignature: row.razorpaySignature,
    status: toPaymentStatus(row.status),
    amount: row.amount,
    currency: row.currency,
    method: row.method,
    errorCode: row.errorCode,
    errorDesc: row.errorDesc,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function batchPaymentsByOrderIds(orderIds: string[]): Promise<Map<string, Payment>> {
  const unique = [...new Set(orderIds)];
  const map = new Map<string, Payment>();
  if (unique.length === 0) {
    return map;
  }

  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.payment.findMany({
        where: { orderId: { in: unique } },
        orderBy: { createdAt: 'desc' },
      });
      for (const row of rows) {
        if (!map.has(row.orderId)) {
          map.set(row.orderId, toPayment(row));
        }
      }
    }
    return map;
  }

  const store = globalThis.__mi_inmem_payments__ as Map<string, Payment> | undefined;
  if (store) {
    const matches = [...store.values()]
      .filter((payment) => unique.includes(payment.orderId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    for (const payment of matches) {
      if (!map.has(payment.orderId)) {
        map.set(payment.orderId, payment);
      }
    }
  }
  return map;
}

async function resolveUsers(
  userIds: string[],
): Promise<Map<string, { name: string | null; email: string }>> {
  const unique = [...new Set(userIds)];
  const map = new Map<string, { name: string | null; email: string }>();
  await Promise.all(
    unique.map(async (userId) => {
      const user = await userService.getById(userId);
      if (user) {
        map.set(userId, { name: user.name, email: user.email });
      }
    }),
  );
  return map;
}

async function resolveMemberships(
  membershipIds: string[],
): Promise<
  Map<
    string,
    {
      status: string;
      planId: string;
      planName: string | null;
    }
  >
> {
  const unique = [...new Set(membershipIds.filter(Boolean))];
  const map = new Map<
    string,
    { status: string; planId: string; planName: string | null }
  >();
  await Promise.all(
    unique.map(async (membershipId) => {
      const membership = await membershipService.getMembership(membershipId);
      if (membership) {
        map.set(membershipId, {
          status: membership.status,
          planId: membership.planId,
          planName: membership.plan?.name ?? null,
        });
      }
    }),
  );
  return map;
}

export async function fetchAllOrders(): Promise<Order[]> {
  const all: Order[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const result = await orderService.listAllOrders({ page, pageSize });
    all.push(...result.items);
    if (page >= result.pageCount) {
      break;
    }
    page += 1;
  }

  return all;
}

export async function buildAdminPaymentRows(orders: Order[]): Promise<AdminPaymentListItem[]> {
  if (orders.length === 0) {
    return [];
  }

  const payments = await batchPaymentsByOrderIds(orders.map((o) => o.id));
  const userIds = orders.map((o) => o.userId);
  const membershipIds = orders
    .map((o) => o.membershipId)
    .filter((id): id is string => id !== null);

  const [users, memberships] = await Promise.all([
    resolveUsers(userIds),
    resolveMemberships(membershipIds),
  ]);

  const rows: AdminPaymentListItem[] = [];

  for (const order of orders) {
    const payment = payments.get(order.id);
    if (!payment) {
      continue;
    }

    const user = users.get(order.userId);
    const membership = order.membershipId
      ? memberships.get(order.membershipId)
      : undefined;

    rows.push({
      id: payment.id,
      paymentId: payment.id,
      orderId: order.id,
      razorpayPaymentId: payment.razorpayPaymentId,
      userName: user?.name ?? null,
      userEmail: user?.email ?? 'Unknown user',
      planId: membership?.planId ?? null,
      planName: membership?.planName ?? null,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
      membershipId: order.membershipId,
      membershipStatus: membership?.status ?? null,
    });
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return rows;
}

export async function fetchAllAdminPaymentRows(): Promise<AdminPaymentListItem[]> {
  const orders = await fetchAllOrders();
  return buildAdminPaymentRows(orders);
}

export function matchesPaymentSearch(item: AdminPaymentListItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    item.orderId.toLowerCase().includes(q) ||
    (item.razorpayPaymentId?.toLowerCase().includes(q) ?? false) ||
    item.userEmail.toLowerCase().includes(q) ||
    (item.userName?.toLowerCase().includes(q) ?? false)
  );
}

export async function enrichAdminPaymentDetail(
  payment: Payment,
): Promise<import('@/types/admin-payment').AdminPaymentDetail | null> {
  const order = await orderService.getOrder(payment.orderId);
  if (!order) {
    return null;
  }

  const [user, membership] = await Promise.all([
    userService.getById(order.userId),
    order.membershipId ? membershipService.getMembership(order.membershipId) : null,
  ]);

  const plan = membership?.plan ?? (membership ? await membershipPlanService.getPlan(membership.planId) : null);

  return {
    id: payment.id,
    paymentId: payment.id,
    orderId: order.id,
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    userName: user?.name ?? null,
    userEmail: user?.email ?? 'Unknown user',
    planId: membership?.planId ?? plan?.id ?? null,
    planName: plan?.name ?? null,
    planPrice: plan?.price ?? null,
    planValidityDays: plan?.validityDays ?? null,
    planDownloadLimit: plan?.downloadLimit ?? null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    orderStatus: order.status,
    createdAt: payment.createdAt,
    membershipId: order.membershipId,
    membershipStatus: membership?.status ?? null,
    membershipStartDate: membership?.startDate ?? null,
    membershipEndDate: membership?.endDate ?? null,
  };
}
