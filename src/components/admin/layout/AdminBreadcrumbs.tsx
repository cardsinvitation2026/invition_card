'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { adminRoutes } from '@/lib/admin/routes';

const LABELS: Record<string, string> = {
  admin: 'Dashboard',
  categories: 'Categories',
  templates: 'Templates',
  'template-fields': 'Template Fields',
  'template-music': 'Template Music',
  'render-jobs': 'Render Jobs',
  payments: 'Payments & Revenue',
  users: 'Users',
  memberships: 'Memberships',
  operations: 'Operations',
  audit: 'Audit',
  'launch-readiness': 'Launch Readiness',
  new: 'New',
};

function labelFor(segment: string, index: number, segments: string[]): string {
  if (segment === 'admin' && index === 0) return 'Dashboard';
  if (segment === 'render-jobs' && index === segments.length - 1 && segments.length > 2) {
    return 'Details';
  }
  if (segment === 'payments' && index === segments.length - 1 && segments.length > 2) {
    return 'Details';
  }
  if (segment === 'users' && index === segments.length - 1 && segments.length > 2) {
    return 'Details';
  }
  if (segment === 'memberships' && index === segments.length - 1 && segments.length > 2) {
    return 'Details';
  }
  if (segment === 'audit' && index === segments.length - 1 && segments.length === 2) {
    return 'Audit';
  }
  if (segments[index - 1] === 'audit' && index === segments.length - 1) {
    return 'Investigation';
  }
  if (LABELS[segment]) return LABELS[segment];
  if (index === segments.length - 1 && segments[index - 1] !== 'new') return 'Edit';
  return segment;
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length <= 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const crumbs = parts.map((part, i) => {
    const href = `/${parts.slice(0, i + 1).join('/')}`;
    const isLast = i === parts.length - 1;
    const label = labelFor(part, i, parts);
    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="contents">
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href === '/admin' ? adminRoutes.dashboard : crumb.href}>
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
