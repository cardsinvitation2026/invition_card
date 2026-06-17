import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { orderService } from '@/features/orders';
import { membershipService } from '@/features/memberships';
import { draftService } from '@/features/drafts';
import { downloadLogService } from '@/features/download-logs';
import { userService } from '@/features/users';
import {
  batchPaymentsByOrderIds,
  fetchAllOrders,
} from '@/lib/admin/payment-enrichment';
import { buildLifetimeSpendByUser } from '@/lib/admin/revenue';
import type { AppUser } from '@/types/user';
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserMembershipItem,
} from '@/types/admin-user';

export interface UserMetricsBundle {
  draftCounts: Map<string, number>;
  renderCounts: Map<string, number>;
  downloadCounts: Map<string, number>;
  activeMembershipCounts: Map<string, number>;
  lifetimeSpend: Map<string, number>;
  totalDrafts: number;
  totalRenders: number;
}

function isActiveMembership(endDate: string, now: Date = new Date()): boolean {
  return new Date(endDate).getTime() >= now.getTime();
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
      return rows.map((row) => ({
        id: row.id,
        firebaseUid: row.firebaseUid,
        email: row.email,
        name: row.name,
        photoUrl: row.photoUrl,
        role: row.role as AppUser['role'],
        status: row.status as AppUser['status'],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }
  }

  const store = globalThis.__mi_inmem_users__ as Map<string, AppUser> | undefined;
  if (!store) {
    return [];
  }
  return [...store.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function buildDraftCounts(): Promise<{ counts: Map<string, number>; total: number }> {
  const counts = new Map<string, number>();
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const [groups, total] = await Promise.all([
        prisma.draft.groupBy({
          by: ['userId'],
          _count: { _all: true },
        }),
        prisma.draft.count(),
      ]);
      for (const group of groups) {
        counts.set(group.userId, group._count._all);
      }
      return { counts, total };
    }
  }

  const store = globalThis.__mi_inmem_drafts__ as
    | Map<string, { draft: { userId: string } }>
    | undefined;
  let total = 0;
  if (store) {
    for (const entry of store.values()) {
      const userId = entry.draft.userId;
      counts.set(userId, (counts.get(userId) ?? 0) + 1);
      total += 1;
    }
  }
  return { counts, total };
}

async function buildRenderCounts(): Promise<{ counts: Map<string, number>; total: number }> {
  const counts = new Map<string, number>();
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const [rows, total] = await Promise.all([
        prisma.renderJob.findMany({
          select: { draft: { select: { userId: true } } },
        }),
        prisma.renderJob.count(),
      ]);
      for (const row of rows) {
        const userId = row.draft.userId;
        counts.set(userId, (counts.get(userId) ?? 0) + 1);
      }
      return { counts, total };
    }
  }

  const jobStore = globalThis.__mi_inmem_render_jobs__ as
    | Map<string, { draftId: string }>
    | undefined;
  const draftStore = globalThis.__mi_inmem_drafts__ as
    | Map<string, { draft: { userId: string } }>
    | undefined;
  let total = 0;
  if (jobStore && draftStore) {
    for (const job of jobStore.values()) {
      const draft = draftStore.get(job.draftId);
      if (!draft) {
        continue;
      }
      const userId = draft.draft.userId;
      counts.set(userId, (counts.get(userId) ?? 0) + 1);
      total += 1;
    }
  }
  return { counts, total };
}

async function buildDownloadCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const groups = await prisma.downloadLog.groupBy({
        by: ['userId'],
        _count: { _all: true },
      });
      for (const group of groups) {
        counts.set(group.userId, group._count._all);
      }
      return counts;
    }
  }

  const store = globalThis.__mi_inmem_download_logs__ as
    | Map<string, { userId: string }>
    | undefined;
  if (store) {
    for (const log of store.values()) {
      counts.set(log.userId, (counts.get(log.userId) ?? 0) + 1);
    }
  }
  return counts;
}

async function buildActiveMembershipCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const now = new Date();

  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.membership.findMany({
        where: { status: 'ACTIVE', endDate: { gte: now } },
        select: { userId: true },
      });
      for (const row of rows) {
        counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
      }
      return counts;
    }
  }

  const store = globalThis.__mi_inmem_memberships__ as
    | Map<string, { userId: string; status: string; endDate: string }>
    | undefined;
  if (store) {
    for (const membership of store.values()) {
      if (membership.status === 'ACTIVE' && isActiveMembership(membership.endDate, now)) {
        counts.set(membership.userId, (counts.get(membership.userId) ?? 0) + 1);
      }
    }
  }
  return counts;
}

async function buildLifetimeSpendMap(): Promise<Map<string, number>> {
  const orders = await fetchAllOrders();
  const payments = await batchPaymentsByOrderIds(orders.map((order) => order.id));
  return buildLifetimeSpendByUser(orders, payments);
}

export async function buildUserMetricsBundle(): Promise<UserMetricsBundle> {
  const [drafts, renders, downloads, activeMemberships, lifetimeSpend] = await Promise.all([
    buildDraftCounts(),
    buildRenderCounts(),
    buildDownloadCounts(),
    buildActiveMembershipCounts(),
    buildLifetimeSpendMap(),
  ]);

  return {
    draftCounts: drafts.counts,
    renderCounts: renders.counts,
    downloadCounts: downloads,
    activeMembershipCounts: activeMemberships,
    lifetimeSpend,
    totalDrafts: drafts.total,
    totalRenders: renders.total,
  };
}

export function buildAdminUserListItems(
  users: AppUser[],
  metrics: UserMetricsBundle,
): AdminUserListItem[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    activeMembershipCount: metrics.activeMembershipCounts.get(user.id) ?? 0,
    draftCount: metrics.draftCounts.get(user.id) ?? 0,
    renderCount: metrics.renderCounts.get(user.id) ?? 0,
    downloadCount: metrics.downloadCounts.get(user.id) ?? 0,
    lifetimeSpend: metrics.lifetimeSpend.get(user.id) ?? 0,
    createdAt: user.createdAt,
  }));
}

export function matchesUserSearch(item: AdminUserListItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    item.email.toLowerCase().includes(q) ||
    (item.name?.toLowerCase().includes(q) ?? false)
  );
}

function toMembershipItems(
  memberships: Awaited<ReturnType<typeof membershipService.resolveActiveMembership>>['memberships'],
): AdminUserMembershipItem[] {
  return memberships.map((membership) => ({
    id: membership.id,
    planName: membership.plan?.name ?? 'Unknown plan',
    status: membership.status,
    startDate: membership.startDate,
    endDate: membership.endDate,
    downloadsUsed: membership.downloadsUsed,
    downloadLimit: membership.plan?.downloadLimit ?? null,
  }));
}

async function countRendersForUser(userId: string): Promise<number> {
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      return prisma.renderJob.count({ where: { draft: { userId } } });
    }
  }

  const jobStore = globalThis.__mi_inmem_render_jobs__ as
    | Map<string, { draftId: string }>
    | undefined;
  const draftStore = globalThis.__mi_inmem_drafts__ as
    | Map<string, { draft: { userId: string } }>
    | undefined;
  if (!jobStore || !draftStore) {
    return 0;
  }

  let count = 0;
  for (const job of jobStore.values()) {
    if (draftStore.get(job.draftId)?.draft.userId === userId) {
      count += 1;
    }
  }
  return count;
}

async function fetchRecentRenders(userId: string, limit: number) {
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.renderJob.findMany({
        where: { draft: { userId } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, status: true, createdAt: true },
      });
      return rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      }));
    }
  }

  const jobStore = globalThis.__mi_inmem_render_jobs__ as
    | Map<string, { id: string; draftId: string; status: string; createdAt: string }>
    | undefined;
  const draftStore = globalThis.__mi_inmem_drafts__ as
    | Map<string, { draft: { userId: string } }>
    | undefined;
  if (!jobStore || !draftStore) {
    return [];
  }

  return [...jobStore.values()]
    .filter((job) => draftStore.get(job.draftId)?.draft.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((job) => ({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
    }));
}

async function fetchAllOrdersForUser(userId: string) {
  const all = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const result = await orderService.listOrdersByUser(userId, { page, pageSize });
    all.push(...result.items);
    if (page >= result.pageCount) {
      break;
    }
    page += 1;
  }
  return all;
}

export async function enrichAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const user = await userService.getById(userId);
  if (!user) {
    return null;
  }

  const [activeResult, orders, draftsPage, downloadPage, recentRenders, draftCount, renderCount] =
    await Promise.all([
      membershipService.resolveActiveMembership(userId),
      fetchAllOrdersForUser(userId),
      draftService.listDrafts(userId, { page: 1, pageSize: 5 }),
      downloadLogService.listByUser(userId, { page: 1, pageSize: 5 }),
      fetchRecentRenders(userId, 5),
      draftService.countDrafts(userId),
      countRendersForUser(userId),
    ]);

  const payments = await batchPaymentsByOrderIds(orders.map((order) => order.id));

  let successfulPurchases = 0;
  let lifetimeSpend = 0;
  for (const order of orders) {
    const payment = payments.get(order.id);
    if (payment?.status === 'SUCCESS') {
      successfulPurchases += 1;
      lifetimeSpend += payment.amount;
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    activeMemberships: toMembershipItems(activeResult.memberships),
    purchaseSummary: {
      totalPurchases: orders.length,
      successfulPurchases,
      lifetimeSpend,
    },
    activitySummary: {
      draftCount,
      renderCount,
      downloadCount: downloadPage.total,
    },
    recentDrafts: draftsPage.items.map((draft) => ({
      id: draft.id,
      title: draft.templateName,
      createdAt: draft.createdAt,
    })),
    recentRenders,
    recentDownloads: downloadPage.items.map((log) => ({
      id: log.id,
      downloadedAt: log.downloadedAt,
      downloadType: log.downloadType,
    })),
  };
}
