'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TemplateMusicForm } from '@/components/admin/forms/TemplateMusicForm';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateMusic } from '@/types/template-music';
import type { CreateMusicInput } from '@/validations/template-music.validation';
import { toast } from 'sonner';

export default function AdminTemplateMusicEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [music, setMusic] = useState<TemplateMusic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminFetch<{ music: TemplateMusic }>(`/api/admin/template-music/${id}`)
      .then((r) => setMusic(r.data?.music ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !music) return <ErrorState description={error ?? 'Music not found'} />;

  return (
    <>
      <AdminPageHeader
        title={`Edit: ${music.name}`}
        actions={
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 size-4" /> Delete
          </Button>
        }
      />
      <TemplateMusicForm
        cancelHref={adminRoutes.templateMusic}
        submitLabel="Update track"
        defaultValues={{
          title: music.name,
          audioUrl: music.url,
          durationSeconds: music.durationSec,
          artist: music.artist,
          license: music.license,
          active: music.active,
          isDefault: false,
        }}
        onSubmit={async (values: CreateMusicInput) => {
          await adminFetch(`/api/admin/template-music/${id}`, {
            method: 'PUT',
            body: JSON.stringify(values),
          });
          router.push(adminRoutes.templateMusic);
        }}
      />
      <AdminDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityName={music.name}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await adminFetch(`/api/admin/template-music/${id}`, { method: 'DELETE' });
            toast.success('Music deleted');
            router.push(adminRoutes.templateMusic);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
          } finally {
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
