import 'server-only';
import { renderJobService } from '@/features/render-jobs';
import type { AuthSession } from '@/types/auth';
import type { RenderJobDetail } from '@/types/render-job';
import type {
  AdminRenderJobListResult,
  AdminRenderJobSummary,
} from '@/types/admin-render-job';
import type { AdminRenderJobListQueryInput } from '@/validations/admin-render-job.validation';
import {
  enrichRenderJobs,
  matchesRenderJobSearch,
} from '@/lib/admin/render-job-enrichment';

async function fetchSummary(session: AuthSession): Promise<AdminRenderJobSummary> {
  const [total, pending, processing, completed, failed] = await Promise.all([
    renderJobService.listRenderJobs(session, { page: 1, pageSize: 1 }),
    renderJobService.listRenderJobs(session, { page: 1, pageSize: 1, status: 'PENDING' }),
    renderJobService.listRenderJobs(session, {
      page: 1,
      pageSize: 1,
      status: 'PROCESSING',
    }),
    renderJobService.listRenderJobs(session, { page: 1, pageSize: 1, status: 'COMPLETED' }),
    renderJobService.listRenderJobs(session, { page: 1, pageSize: 1, status: 'FAILED' }),
  ]);

  return {
    total: total.total,
    pending: pending.total,
    processing: processing.total,
    completed: completed.total,
    failed: failed.total,
  };
}

async function fetchAllRenderJobs(session: AuthSession): Promise<RenderJobDetail[]> {
  const all: RenderJobDetail[] = [];
  let page = 1;
  const pageSize = 50;

  while (true) {
    const result = await renderJobService.listRenderJobs(session, { page, pageSize });
    all.push(...result.items);
    if (page >= result.pageCount) {
      break;
    }
    page += 1;
  }

  return all;
}

export async function listAdminRenderJobs(
  session: AuthSession,
  input: AdminRenderJobListQueryInput,
): Promise<AdminRenderJobListResult> {
  const summary = await fetchSummary(session);
  const needsClientFilter = Boolean(input.templateId || input.search);

  let sourceJobs: RenderJobDetail[];

  if (needsClientFilter) {
    sourceJobs = await fetchAllRenderJobs(session);
    if (input.status) {
      sourceJobs = sourceJobs.filter((job) => job.status === input.status);
    }
  } else {
    const result = await renderJobService.listRenderJobs(session, {
      page: input.page,
      pageSize: input.pageSize,
      status: input.status,
    });
    const items = await enrichRenderJobs(result.items);
    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
      summary,
    };
  }

  const enriched = await enrichRenderJobs(sourceJobs);
  let filtered = enriched;

  if (input.templateId) {
    filtered = filtered.filter((item) => item.templateId === input.templateId);
  }
  if (input.search) {
    filtered = filtered.filter((item) => matchesRenderJobSearch(item, input.search!));
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
