'use client';

import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TemplateForm } from '@/components/admin/forms/TemplateForm';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateCreateInput } from '@/validations/template.validation';

export default function AdminTemplateNewPage() {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader title="New template" description="Create a new invitation template." />
      <TemplateForm
        cancelHref={adminRoutes.templates}
        submitLabel="Create template"
        onSubmit={async (values: TemplateCreateInput) => {
          await adminFetch('/api/admin/templates', {
            method: 'POST',
            body: JSON.stringify(values),
          });
          router.push(adminRoutes.templates);
        }}
      />
    </>
  );
}
