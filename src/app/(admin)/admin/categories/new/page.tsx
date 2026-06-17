'use client';

import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CategoryForm } from '@/components/admin/forms/CategoryForm';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { CategoryCreateInput } from '@/validations/category.validation';

export default function AdminCategoryNewPage() {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader title="New category" description="Create a new invitation category." />
      <CategoryForm
        cancelHref={adminRoutes.categories}
        submitLabel="Create category"
        onSubmit={async (values: CategoryCreateInput) => {
          await adminFetch('/api/admin/categories', {
            method: 'POST',
            body: JSON.stringify(values),
          });
          router.push(adminRoutes.categories);
        }}
      />
    </>
  );
}
