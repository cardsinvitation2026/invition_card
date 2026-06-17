'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { CategoryWithCount } from '@/types/category';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function CategoriesListClient() {
  const [items, setItems] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'sortOrder'>('sortOrder');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ items: CategoryWithCount[]; total: number }>(
        '/api/admin/categories',
      );
      setItems(res.data?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return [...list].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : a.sortOrder - b.sortOrder,
    );
  }, [items, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/categories/${deleteId}`, { method: 'DELETE' });
      toast.success('Category deleted');
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

  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Manage invitation categories."
        actions={
          <Button asChild>
            <Link href={adminRoutes.categoryNew}>
              <Plus className="mr-2 size-4" /> Create category
            </Link>
          </Button>
        }
      />
      <AdminFilters>
        <AdminSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search categories…" />
        <Select value={sort} onValueChange={(v) => setSort(v as 'name' | 'sortOrder')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sortOrder">Sort order</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilters>
      {pageItems.length === 0 ? (
        <AdminEmptyState title="No categories found" description="Create your first category or adjust filters." />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: 'name', header: 'Name', cell: (r) => r.name },
              { key: 'slug', header: 'Slug', cell: (r) => r.slug },
              {
                key: 'status',
                header: 'Status',
                cell: (r) => (
                  <AdminStatusBadge
                    label={r.active ? 'Active' : 'Inactive'}
                    variant={r.active ? 'success' : 'muted'}
                  />
                ),
              },
              { key: 'sort', header: 'Order', cell: (r) => r.sortOrder },
              { key: 'count', header: 'Templates', cell: (r) => r.templateCount },
              {
                key: 'actions',
                header: 'Actions',
                cell: (r) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={adminRoutes.categoryEdit(r.id)}>
                        <Pencil className="size-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteId(r.id);
                        setDeleteName(r.name);
                      }}
                      aria-label={`Delete ${r.name}`}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={pageItems}
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
