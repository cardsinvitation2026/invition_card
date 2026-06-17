'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import type { ApiResponse } from '@/types/api';
import type { DownloadLogListResult } from '@/types/download-log';
import type { SignedVideoAccess } from '@/types/video-access';

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function MyDownloadsListClient() {
  const [items, setItems] = useState<DownloadLogListResult['items']>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingLogId, setOpeningLogId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/downloads?${qs.toString()}`, { credentials: 'include' });
      const data = (await res.json()) as ApiResponse<DownloadLogListResult>;
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? 'Failed to load downloads');
      }
      setItems(data.data?.items ?? []);
      setPageCount(data.data?.pageCount ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDownloadVideo = useCallback(async (downloadLogId: string) => {
    setOpeningLogId(downloadLogId);
    try {
      const res = await fetch(
        `/api/video-access/download/${encodeURIComponent(downloadLogId)}`,
        { credentials: 'include' },
      );
      const data = (await res.json()) as ApiResponse<SignedVideoAccess>;
      if (!res.ok || !data.success || !data.data?.url) {
        toast.error(data.message ?? 'Video unavailable');
        return;
      }
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to open video');
    } finally {
      setOpeningLogId(null);
    }
  }, []);

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
      <ErrorState
        title="Failed to load downloads"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="No downloads yet"
        description="Complete a video render and download it to see your history here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Downloaded</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Membership</th>
              <th className="px-4 py-3 font-medium">Video</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isOpening = openingLogId === item.id;
              const canOpen = item.hasVideo ?? false;
              return (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(item.downloadedAt)}</td>
                  <td className="px-4 py-3">{item.templateName ?? 'Unknown template'}</td>
                  <td className="px-4 py-3">{item.membershipPlanName ?? 'Membership'}</td>
                  <td className="px-4 py-3">
                    {canOpen ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : (
                      <Badge variant="outline">Missing</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canOpen || isOpening}
                      onClick={() => void openDownloadVideo(item.id)}
                    >
                      {isOpening ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 size-4" />
                      )}
                      Download
                      <ExternalLink className="ml-2 size-3 opacity-60" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
