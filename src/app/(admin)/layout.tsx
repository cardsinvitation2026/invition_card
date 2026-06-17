import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth/server';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: 'Admin', template: '%s | Admin' },
};

export default async function AdminRouteLayout({ children }: { children: ReactNode }) {
  try {
    await requireSuperAdmin();
  } catch {
    redirect('/login?next=/admin');
  }

  return <AdminLayout>{children}</AdminLayout>;
}
