import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { templateService } from '@/features/templates';
import { userService } from '@/features/users';
import type { RenderJobDetail } from '@/types/render-job';
import type { AdminRenderJobListItem } from '@/types/admin-render-job';

async function resolveDraftOwners(draftIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(draftIds)];
  const map = new Map<string, string>();
  if (unique.length === 0) {
    return map;
  }

  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const rows = await prisma.draft.findMany({
        where: { id: { in: unique } },
        select: { id: true, userId: true },
      });
      for (const row of rows) {
        map.set(row.id, row.userId);
      }
    }
    return map;
  }

  const store = globalThis.__mi_inmem_drafts__ as
    | Map<string, { userId: string }>
    | undefined;
  if (store) {
    for (const id of unique) {
      const draft = store.get(id);
      if (draft) {
        map.set(id, draft.userId);
      }
    }
  }
  return map;
}

async function resolveTemplates(
  templateIds: string[],
): Promise<Map<string, { name: string; slug: string }>> {
  const unique = [...new Set(templateIds)];
  const map = new Map<string, { name: string; slug: string }>();
  if (unique.length === 0) {
    return map;
  }

  const adminList = await templateService.listTemplatesAdmin({
    page: 1,
    pageSize: 100,
  });
  for (const template of adminList.items) {
    if (unique.includes(template.id)) {
      map.set(template.id, { name: template.name, slug: template.slug });
    }
  }

  for (const id of unique) {
    if (!map.has(id)) {
      const template = await templateService.getTemplate(id);
      if (template) {
        map.set(id, { name: template.name, slug: template.slug });
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

export async function enrichRenderJobs(
  jobs: RenderJobDetail[],
): Promise<AdminRenderJobListItem[]> {
  if (jobs.length === 0) {
    return [];
  }

  const draftOwners = await resolveDraftOwners(jobs.map((job) => job.draftId));
  const userIds = [...draftOwners.values()];
  const [templates, users] = await Promise.all([
    resolveTemplates(jobs.map((job) => job.templateId)),
    resolveUsers(userIds),
  ]);

  return jobs.map((job) => {
    const userId = draftOwners.get(job.draftId);
    const user = userId ? users.get(userId) : undefined;
    const template = templates.get(job.templateId);

    return {
      id: job.id,
      draftId: job.draftId,
      templateId: job.templateId,
      templateName: template?.name ?? 'Unknown template',
      templateSlug: template?.slug ?? '',
      userName: user?.name ?? null,
      userEmail: user?.email ?? 'Unknown user',
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      finalUrl: job.finalUrl,
      error: job.error,
    };
  });
}

export function matchesRenderJobSearch(
  item: AdminRenderJobListItem,
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    item.id.toLowerCase().includes(q) ||
    item.templateName.toLowerCase().includes(q) ||
    item.userEmail.toLowerCase().includes(q) ||
    (item.userName?.toLowerCase().includes(q) ?? false)
  );
}
