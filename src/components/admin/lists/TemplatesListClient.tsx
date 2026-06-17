'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateListItem, TemplateListResult } from '@/types/template';
import type { CategoryWithCount } from '@/types/category';
import { toast } from 'sonner';

export function TemplatesListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<TemplateListResult | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const language = searchParams.get('language') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      router.push(`${adminRoutes.templates}?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (category) qs.set('category', category);
      if (language) qs.set('language', language);
      if (status) qs.set('status', status);
      qs.set('page', String(page));
      qs.set('limit', '12');
      const res = await adminFetch<TemplateListResult & { totalCount: number }>(
        `/api/admin/templates?${qs.toString()}`,
      );
      setResult(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [search, category, language, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    adminFetch<{ items: CategoryWithCount[] }>('/api/admin/categories')
      .then((r) => setCategories(r.data?.items ?? []))
      .catch(() => undefined);
  }, []);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/templates/${deleteId}`, { method: 'DELETE' });
      toast.success('Template deleted');
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !result) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const items = result?.items ?? [];

  return (
    <>
      <AdminPageHeader
        title="Templates"
        description="Manage invitation templates."
        actions={
          <Button asChild>
            <Link href={adminRoutes.templateNew}>
              <Plus className="mr-2 size-4" /> Create template
            </Link>
          </Button>
        }
      />
      <AdminFilters>
        <AdminSearch
          value={search}
          onChange={(v) => updateParams({ search: v || null, page: '1' })}
          placeholder="Search templates…"
        />
        <Select value={category || 'all'} onValueChange={(v) => updateParams({ category: v === 'all' ? null : v, page: '1' })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={language || 'all'} onValueChange={(v) => updateParams({ language: v === 'all' ? null : v, page: '1' })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="HI">Hindi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={(v) => updateParams({ status: v === 'all' ? null : v, page: '1' })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilters>
      {items.length === 0 ? (
        <AdminEmptyState title="No templates found" />
      ) : (
        <>
          <AdminTable<TemplateListItem>
            columns={[
              {
                key: 'thumb',
                header: 'Thumbnail',
                cell: (r) =>
                  r.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnail} alt="" className="size-12 rounded object-cover" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
              { key: 'title', header: 'Title', cell: (r) => r.name },
              { key: 'category', header: 'Category', cell: (r) => r.category.name },
              { key: 'lang', header: 'Language', cell: (r) => r.language },
              {
                key: 'badges',
                header: 'Badges',
                cell: (r) => (
                  <div className="flex flex-wrap gap-1">
                    {r.featured && <Badge variant="secondary">Featured</Badge>}
                    {r.trending && <Badge variant="outline">Trending</Badge>}
                    {r.bestSeller && <Badge className="bg-emerald-600">Best Seller</Badge>}
                  </div>
                ),
              },
              {
                key: 'updated',
                header: 'Created',
                cell: (r) => new Date(r.createdAt).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: (r) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={adminRoutes.templateEdit(r.id)}><Pencil className="size-3.5" /></Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDeleteId(r.id); setDeleteName(r.name); }}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={items}
          />
          <AdminPagination
            page={result?.page ?? 1}
            pageCount={result?.pageCount ?? 1}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
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
