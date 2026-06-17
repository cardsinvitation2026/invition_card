'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { formatAccountDate } from '@/lib/account/format';
import type { ApiResponse } from '@/types/api';
import type { RenderJobDetail, RenderJobListResult } from '@/types/render-job';
import type { TemplateListItem, TemplateListResult } from '@/types/template';

const PAGE_SIZE = 10;

function statusVariant(status: RenderJobDetail['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'secondary' as const;
    case 'PROCESSING':
      return 'default' as const;
    case 'FAILED':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export function RenderHistoryClient() {
  const [items, setItems] = useState<RenderJobDetail[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateNames, setTemplateNames] = useState<Record<string, string>>({});
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const [rendersRes, templatesRes] = await Promise.all([
        fetch(`/api/render-jobs?${qs.toString()}`, { credentials: 'include' }),
        fetch('/api/templates?page=1&pageSize=48', { credentials: 'include' }),
      ]);
      const rendersData = (await rendersRes.json()) as ApiResponse<RenderJobListResult>;
      const templatesData = (await templatesRes.json()) as ApiResponse<TemplateListResult>;
      if (!rendersRes.ok || !rendersData.success) {
        throw new Error(rendersData.message ?? 'Failed to load renders');
      }
      setItems(rendersData.data?.items ?? []);
      setPageCount(rendersData.data?.pageCount ?? 1);
      if (templatesRes.ok && templatesData.success && templatesData.data) {
        const map: Record<string, string> = {};
        for (const t of templatesData.data.items as TemplateListItem[]) {
          map[t.id] = t.name;
        }
        setTemplateNames(map);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load renders');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestDownload = useCallback(async (renderJobId: string) => {
    setDownloadingJobId(renderJobId);
    try {
      const res = await fetch(`/api/downloads/${encodeURIComponent(renderJobId)}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as ApiResponse<{ url: string }>;
      if (!res.ok || !data.success || !data.data?.url) {
        toast.error(data.message ?? 'Download failed');
        return;
      }
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingJobId(null);
    }
  }, []);

  const rows = useMemo(() => items, [items]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Failed to load renders" description={error} onRetry={() => void load()} />
    );
  }

  if (rows.length === 0) {
    return (
      <AdminEmptyState
        title="No renders yet"
        description="Create a draft and render a video to see your render history here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Video</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((job) => {
              const isDownloading = downloadingJobId === job.id;
              const canDownload = job.status === 'COMPLETED';
              return (
                <tr key={job.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatAccountDate(job.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {templateNames[job.templateId] ?? 'Template'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatAccountDate(job.completedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {canDownload ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canDownload || isDownloading}
                      onClick={() => void requestDownload(job.id)}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 size-4" />
                      )}
                      Open video
                      <ExternalLink className="ml-2 size-3 opacity-60" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((job) => {
          const isDownloading = downloadingJobId === job.id;
          const canDownload = job.status === 'COMPLETED';
          return (
            <Card key={job.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{templateNames[job.templateId] ?? 'Template'}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatAccountDate(job.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed {formatAccountDate(job.completedAt)}
                </p>
                <Button
                  className="w-full"
                  size="sm"
                  variant="outline"
                  disabled={!canDownload || isDownloading}
                  onClick={() => void requestDownload(job.id)}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 size-4" />
                  )}
                  Open video
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
