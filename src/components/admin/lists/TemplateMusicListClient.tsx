'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateMusic } from '@/types/template-music';
import { toast } from 'sonner';

export function TemplateMusicListClient() {
  const [items, setItems] = useState<TemplateMusic[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{
        items: TemplateMusic[];
        total: number;
        defaultMusic: TemplateMusic | null;
      }>('/api/admin/template-music');
      setItems(res.data?.items ?? []);
      setDefaultId(res.data?.defaultMusic?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load music');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setDefault(id: string) {
    try {
      await adminFetch(`/api/admin/template-music/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isDefault: true }),
      });
      toast.success('Default music updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to set default');
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/template-music/${deleteId}`, { method: 'DELETE' });
      toast.success('Music deleted');
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <>
      <AdminPageHeader
        title="Template Music"
        description="Manage background music tracks."
        actions={
          <Button asChild>
            <Link href={adminRoutes.templateMusicNew}>
              <Plus className="mr-2 size-4" /> Add music
            </Link>
          </Button>
        }
      />
      {items.length === 0 ? (
        <AdminEmptyState title="No music tracks" description="Add your first background music track." />
      ) : (
        <AdminTable
          columns={[
            { key: 'title', header: 'Title', cell: (r) => r.name },
            { key: 'artist', header: 'Artist', cell: (r) => r.artist ?? '—' },
            {
              key: 'duration',
              header: 'Duration',
              cell: (r) => (r.durationSec != null ? `${r.durationSec}s` : '—'),
            },
            {
              key: 'default',
              header: 'Default',
              cell: (r) =>
                r.id === defaultId ? (
                  <AdminStatusBadge label="Default" variant="success" />
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => void setDefault(r.id)}>
                    <Star className="mr-1 size-3.5" /> Set default
                  </Button>
                ),
            },
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
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={adminRoutes.templateMusicEdit(r.id)}><Pencil className="size-3.5" /></Link>
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
