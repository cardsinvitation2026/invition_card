'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { deleteDraft } from '@/lib/drafts/api';
import type { ApiResponse } from '@/types/api';
import type { DraftListItem, DraftListResult } from '@/types/draft';

const PAGE_SIZE = 10;

export function MyDraftsListClient() {
  const router = useRouter();
  const [items, setItems] = useState<DraftListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search.trim()) {
        qs.set('search', search.trim());
      }
      const res = await fetch(`/api/drafts?${qs.toString()}`, { credentials: 'include' });
      const data = (await res.json()) as ApiResponse<DraftListResult>;
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? 'Failed to load drafts');
      }
      setItems(data.data?.items ?? []);
      setPageCount(data.data?.pageCount ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const formattedItems = useMemo(() => items, [items]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDraft(deleteId);
      toast.success('Draft deleted');
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My drafts</h1>
          <p className="text-sm text-muted-foreground">Continue editing saved invitation drafts.</p>
        </div>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search drafts…"
          className="max-w-xs"
        />
      </div>

      {formattedItems.length === 0 ? (
        <AdminEmptyState
          title="No drafts yet"
          description="Start personalising a template to create your first draft."
        />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: 'template', header: 'Template', cell: (r) => r.templateName },
              {
                key: 'updated',
                header: 'Updated',
                cell: (r) => new Date(r.updatedAt).toLocaleString(),
              },
              {
                key: 'created',
                header: 'Created',
                cell: (r) => new Date(r.createdAt).toLocaleString(),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: (r) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!r.templateSlug}
                      onClick={() => router.push(`/templates/${r.templateSlug}/edit`)}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      Continue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteId(r.id);
                        setDeleteName(r.templateName);
                      }}
                      aria-label={`Delete ${r.templateName}`}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={formattedItems}
          />
          <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      <AdminDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        entityName={deleteName}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
      />
    </>
  );
}
