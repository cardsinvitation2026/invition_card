'use client';

import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TemplateMusicForm } from '@/components/admin/forms/TemplateMusicForm';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { CreateMusicInput } from '@/validations/template-music.validation';

export default function AdminTemplateMusicNewPage() {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader title="New music track" description="Add a background music track by URL." />
      <TemplateMusicForm
        cancelHref={adminRoutes.templateMusic}
        submitLabel="Create track"
        onSubmit={async (values: CreateMusicInput) => {
          await adminFetch('/api/admin/template-music', {
            method: 'POST',
            body: JSON.stringify(values),
          });
          router.push(adminRoutes.templateMusic);
        }}
      />
    </>
  );
}
