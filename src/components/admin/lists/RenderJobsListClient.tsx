'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminRenderJobSummaryCards } from '@/components/admin/render-jobs/AdminRenderJobSummaryCards';
import {
  RenderJobStatusBadge,
  displayUserLabel,
  openSecureRenderVideo,
  truncateJobId,
} from '@/components/admin/render-jobs/render-job-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import {
  formatAdminDateTime,
  formatRenderDuration,
} from '@/lib/admin/render-job-format';
import type { AdminRenderJobListItem, AdminRenderJobListResult } from '@/types/admin-render-job';
import type { TemplateListItem } from '@/types/template';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
] as const;

export function RenderJobsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AdminRenderJobListResult | null>(null);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const templateId = searchParams.get('templateId') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === 'all') params.delete(k);
        else params.set(k, v);
      });
      router.push(`${adminRoutes.renderJobs}?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (status !== 'all') qs.set('status', status);
      if (templateId !== 'all') qs.set('templateId', templateId);
      qs.set('page', String(page));
      qs.set('pageSize', '20');
      const res = await adminFetch<AdminRenderJobListResult>(
        `/api/admin/render-jobs?${qs.toString()}`,
      );
      setResult(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load render jobs');
    } finally {
      setLoading(false);
    }
  }, [search, status, templateId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    adminFetch<{ items: TemplateListItem[]; totalCount?: number }>(
      '/api/admin/templates?page=1&limit=100',
    )
      .then((r) => setTemplates(r.data?.items ?? []))
      .catch(() => undefined);
  }, []);

  if (loading && !result) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  const items = result?.items ?? [];

  return (
    <TooltipProvider>
      <AdminPageHeader
        title="Render Jobs"
        description="Monitor all video render jobs across the platform."
      />

      <div className="space-y-6">
        <AdminRenderJobSummaryCards summary={result?.summary ?? null} />

        <AdminFilters>
          <AdminSearch
            value={search}
            onChange={(value) => updateParams({ search: value || null, page: '1' })}
            placeholder="Search job id, user, or template…"
          />
          <Select
            value={status}
            onValueChange={(value) => updateParams({ status: value, page: '1' })}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={templateId}
            onValueChange={(value) => updateParams({ templateId: value, page: '1' })}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminFilters>

        {items.length === 0 ? (
          <AdminEmptyState title="No render jobs found" />
        ) : (
          <>
            <AdminTable
              rows={items}
              columns={[
                {
                  key: 'id',
                  header: 'Job ID',
                  cell: (row: AdminRenderJobListItem) => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {truncateJobId(row.id)}
                        </code>
                      </TooltipTrigger>
                      <TooltipContent>{row.id}</TooltipContent>
                    </Tooltip>
                  ),
                },
                {
                  key: 'template',
                  header: 'Template',
                  cell: (row) => row.templateName,
                },
                {
                  key: 'user',
                  header: 'User',
                  cell: (row) => displayUserLabel(row.userName, row.userEmail),
                },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (row) => <RenderJobStatusBadge status={row.status} />,
                },
                {
                  key: 'created',
                  header: 'Created',
                  cell: (row) => formatAdminDateTime(row.createdAt),
                },
                {
                  key: 'completed',
                  header: 'Completed',
                  cell: (row) => formatAdminDateTime(row.completedAt),
                },
                {
                  key: 'duration',
                  header: 'Duration',
                  cell: (row) =>
                    formatRenderDuration(row.createdAt, row.completedAt) ?? '—',
                },
                {
                  key: 'output',
                  header: 'Output',
                  cell: (row) =>
                    row.status === 'COMPLETED' ? (
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => void openSecureRenderVideo(row.id)}
                      >
                        Open Video
                        <ExternalLink className="ml-1 size-3" />
                      </Button>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  className: 'text-right',
                  cell: (row) => (
                    <Button asChild variant="outline" size="sm">
                      <Link href={adminRoutes.renderJobDetail(row.id)}>
                        <Eye className="mr-2 size-4" />
                        View
                      </Link>
                    </Button>
                  ),
                },
              ]}
              mobileCard={(row) => (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.templateName}</p>
                      <code className="font-mono text-xs text-muted-foreground">
                        {truncateJobId(row.id)}
                      </code>
                    </div>
                    <RenderJobStatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {displayUserLabel(row.userName, row.userEmail)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAdminDateTime(row.createdAt)}
                    {row.completedAt
                      ? ` · ${formatRenderDuration(row.createdAt, row.completedAt)}`
                      : ''}
                  </p>
                  <div className="flex gap-2">
                    {row.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openSecureRenderVideo(row.id)}
                      >
                        Open Video
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={adminRoutes.renderJobDetail(row.id)}>View</Link>
                    </Button>
                  </div>
                </div>
              )}
            />
            <AdminPagination
              page={result?.page ?? 1}
              pageCount={result?.pageCount ?? 1}
              onPageChange={(p) => updateParams({ page: String(p) })}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
