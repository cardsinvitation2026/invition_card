import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { membershipService } from '@/features/memberships';
import { userService } from '@/features/users';
import { calculateRemainingDownloadsFromMemberships } from '@/features/memberships/membership-entitlement.service';
import type { MembershipDetail } from '@/types/membership-engine';
import type {
  AdminMembershipDetail,
  AdminMembershipListItem,
  AdminMembershipRecentDownload,
} from '@/types/admin-membership';

export function getMembershipQuotaInfo(membership: MembershipDetail): {
  downloadLimit: number | null;
  remainingDownloads: number | null;
  remainingLabel: string;
  usagePercentage: number | null;
} {
  const downloadLimit = membership.plan?.downloadLimit ?? null;
  const { perMembership } = calculateRemainingDownloadsFromMemberships([membership]);
  const entry = perMembership[0];
  const remainingDownloads = entry?.remaining ?? null;

  if (downloadLimit === null) {
    return {
      downloadLimit: null,
      remainingDownloads: null,
      remainingLabel: 'Unlimited',
      usagePercentage: null,
    };
  }

  const remaining = Math.max(0, remainingDownloads ?? 0);
  const usagePercentage =
    downloadLimit > 0 ? Math.round((membership.downloadsUsed / downloadLimit) * 100) : 0;

  return {
    downloadLimit,
    remainingDownloads: remaining,
    remainingLabel: String(remaining),
    usagePercentage,
  };
}

export async function resolveMembershipUsers(
  userIds: string[],
): Promise<Map<string, { name: string | null; email: string; role: string }>> {
  const unique = [...new Set(userIds)];
  const map = new Map<string, { name: string | null; email: string; role: string }>();
  await Promise.all(
    unique.map(async (userId) => {
      const user = await userService.getById(userId);
      if (user) {
        map.set(userId, { name: user.name, email: user.email, role: user.role });
      }
    }),
  );
  return map;
}

export async function fetchAllMemberships(): Promise<MembershipDetail[]> {
  const all: MembershipDetail[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const result = await membershipService.listAllMemberships({ page, pageSize });
    all.push(...result.items);
    if (page >= result.pageCount) {
      break;
    }
    page += 1;
  }

  return all;
}

export function buildAdminMembershipListItems(
  memberships: MembershipDetail[],
  users: Map<string, { name: string | null; email: string; role: string }>,
): AdminMembershipListItem[] {
  return memberships.map((membership) => {
    const user = users.get(membership.userId);
    const quota = getMembershipQuotaInfo(membership);

    return {
      id: membership.id,
      userId: membership.userId,
      userName: user?.name ?? null,
      userEmail: user?.email ?? 'Unknown user',
      planId: membership.planId,
      planName: membership.plan?.name ?? 'Unknown plan',
      status: membership.status,
      downloadsUsed: membership.downloadsUsed,
      downloadLimit: quota.downloadLimit,
      remainingDownloads: quota.remainingDownloads,
      remainingLabel: quota.remainingLabel,
      startDate: membership.startDate,
      endDate: membership.endDate,
    };
  });
}

export function matchesMembershipSearch(
  item: AdminMembershipListItem,
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    item.userEmail.toLowerCase().includes(q) ||
    (item.userName?.toLowerCase().includes(q) ?? false)
  );
}

async function enrichRecentDownloads(
  logs: Array<{
    id: string;
    userId: string;
    draftId: string;
    downloadedAt: string;
    downloadType: string | null;
    fileUrl: string | null;
  }>,
): Promise<AdminMembershipRecentDownload[]> {
  if (logs.length === 0) {
    return [];
  }

  const draftIds = [...new Set(logs.map((log) => log.draftId))];
  const draftMeta = new Map<string, { title: string | null; templateName: string | null }>();

  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.draft.findMany({
        where: { id: { in: draftIds } },
        select: {
          id: true,
          title: true,
          template: { select: { name: true } },
        },
      });
      for (const row of rows) {
        draftMeta.set(row.id, {
          title: row.title,
          templateName: row.template.name,
        });
      }
    }
  } else {
    const store = globalThis.__mi_inmem_drafts__ as
      | Map<string, { draft: { id: string; title: string; templateId: string } }>
      | undefined;
    const templateNames = globalThis.__mi_inmem_draft_template_names__ as
      | Map<string, string>
      | undefined;
    if (store) {
      for (const id of draftIds) {
        const entry = store.get(id);
        if (entry) {
          draftMeta.set(id, {
            title: entry.draft.title,
            templateName: templateNames?.get(entry.draft.templateId) ?? null,
          });
        }
      }
    }
  }

  return logs.map((log) => {
    const meta = draftMeta.get(log.draftId);
    return {
      id: log.id,
      downloadedAt: log.downloadedAt,
      draftId: log.draftId,
      draftTitle: meta?.title ?? null,
      templateName: meta?.templateName ?? null,
      downloadType: log.downloadType,
      fileUrl: log.fileUrl,
    };
  });
}

async function fetchRecentDownloadsForMembership(
  membershipId: string,
  limit: number,
): Promise<AdminMembershipRecentDownload[]> {
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.downloadLog.findMany({
        where: { membershipId },
        orderBy: { downloadedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          userId: true,
          draftId: true,
          downloadedAt: true,
          downloadType: true,
          fileUrl: true,
        },
      });
      return enrichRecentDownloads(
        rows.map((row) => ({
          id: row.id,
          userId: row.userId,
          draftId: row.draftId,
          downloadedAt: row.downloadedAt.toISOString(),
          downloadType: row.downloadType,
          fileUrl: row.fileUrl,
        })),
      );
    }
  }

  const store = globalThis.__mi_inmem_download_logs__ as
    | Map<
        string,
        {
          id: string;
          userId: string;
          membershipId: string;
          draftId: string;
          downloadedAt: string;
          downloadType: string | null;
          fileUrl: string | null;
        }
      >
    | undefined;
  if (!store) {
    return [];
  }

  const logs = [...store.values()]
    .filter((log) => log.membershipId === membershipId)
    .sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt))
    .slice(0, limit);

  return enrichRecentDownloads(logs);
}

export async function enrichAdminMembershipDetail(
  membershipId: string,
): Promise<AdminMembershipDetail | null> {
  const membership = await membershipService.getMembership(membershipId);
  if (!membership) {
    return null;
  }

  const [user, recentDownloads] = await Promise.all([
    userService.getById(membership.userId),
    fetchRecentDownloadsForMembership(membershipId, 10),
  ]);

  const quota = getMembershipQuotaInfo(membership);
  const plan = membership.plan;

  return {
    id: membership.id,
    status: membership.status,
    startDate: membership.startDate,
    endDate: membership.endDate,
    createdAt: membership.createdAt,
    userId: membership.userId,
    userName: user?.name ?? null,
    userEmail: user?.email ?? 'Unknown user',
    userRole: user?.role ?? 'USER',
    planId: membership.planId,
    planName: plan?.name ?? 'Unknown plan',
    planPrice: plan?.price ?? 0,
    planCurrency: plan?.currency ?? 'INR',
    planValidityDays: plan?.validityDays ?? 0,
    planDownloadLimit: plan?.downloadLimit ?? null,
    planDescription: plan?.description ?? null,
    downloadsUsed: membership.downloadsUsed,
    downloadLimit: quota.downloadLimit,
    remainingDownloads: quota.remainingDownloads,
    remainingLabel: quota.remainingLabel,
    usagePercentage: quota.usagePercentage,
    recentDownloads,
  };
}
