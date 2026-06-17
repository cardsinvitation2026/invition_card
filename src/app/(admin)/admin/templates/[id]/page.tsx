'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TemplateForm } from '@/components/admin/forms/TemplateForm';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateDetail } from '@/types/template';
import type { TemplateCreateInput } from '@/validations/template.validation';
import { toast } from 'sonner';

export default function AdminTemplateEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      adminFetch<{ template: TemplateDetail }>(`/api/admin/templates/${id}`),
      adminFetch<{ items: { id: string; slug: string }[] }>('/api/admin/categories'),
    ])
      .then(([tplRes, catRes]) => {
        const tpl = tplRes.data?.template ?? null;
        setTemplate(tpl);
        if (tpl) {
          const cat = catRes.data?.items.find((c) => c.slug === tpl.category.slug);
          setCategoryId(cat?.id ?? '');
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !template) return <ErrorState description={error ?? 'Template not found'} />;

  return (
    <>
      <AdminPageHeader
        title={`Edit: ${template.name}`}
        actions={
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 size-4" /> Delete
          </Button>
        }
      />
      <TemplateForm
        cancelHref={adminRoutes.templates}
        submitLabel="Update template"
        defaultValues={{
          title: template.name,
          slug: template.slug,
          description: template.description,
          categoryId,
          thumbnailUrl: template.thumbnail || null,
          previewVideoUrl: template.demoPreviewUrl,
          language: template.language,
          templateType: template.type,
          visibility: template.visibility,
          status: template.status,
          isFeatured: template.featured,
          metaTitle: template.seoTitle,
          metaDescription: template.seoDescription,
          keywords: template.seoKeywords,
          musicId: template.musicId,
          trending: template.trending,
          bestSeller: template.bestSeller,
        }}
        onSubmit={async (values: TemplateCreateInput) => {
          await adminFetch(`/api/admin/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(values),
          });
          router.push(adminRoutes.templates);
        }}
      />
      <AdminDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityName={template.name}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await adminFetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
            toast.success('Template deleted');
            router.push(adminRoutes.templates);
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
