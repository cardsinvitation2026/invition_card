'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CategoryForm } from '@/components/admin/forms/CategoryForm';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { Category } from '@/types/category';
import type { CategoryCreateInput } from '@/validations/category.validation';
import { toast } from 'sonner';

export default function AdminCategoryEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminFetch<{ category: Category }>(`/api/admin/categories/${id}`)
      .then((r) => setCategory(r.data?.category ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !category) return <ErrorState description={error ?? 'Category not found'} />;

  return (
    <>
      <AdminPageHeader
        title={`Edit: ${category.name}`}
        actions={
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 size-4" /> Delete
          </Button>
        }
      />
      <CategoryForm
        cancelHref={adminRoutes.categories}
        submitLabel="Update category"
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: category.active,
          thumbnail: category.thumbnail,
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          seoKeywords: category.seoKeywords,
        }}
        onSubmit={async (values: CategoryCreateInput) => {
          await adminFetch(`/api/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(values),
          });
          router.push(adminRoutes.categories);
        }}
      />
      <AdminDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityName={category.name}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await adminFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            toast.success('Category deleted');
            router.push(adminRoutes.categories);
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
