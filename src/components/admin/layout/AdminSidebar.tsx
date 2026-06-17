'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  FileImage,
  ListTree,
  Music,
  Clapperboard,
  CreditCard,
  Users,
  BadgeCheck,
  Activity,
  ClipboardList,
  Rocket,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminRoutes } from '@/lib/admin/routes';

const NAV = [
  { href: adminRoutes.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { href: adminRoutes.categories, label: 'Categories', icon: FolderOpen },
  { href: adminRoutes.templates, label: 'Templates', icon: FileImage },
  { href: adminRoutes.templateFields, label: 'Template Fields', icon: ListTree },
  { href: adminRoutes.templateMusic, label: 'Template Music', icon: Music },
  { href: adminRoutes.renderJobs, label: 'Render Jobs', icon: Clapperboard },
  { href: adminRoutes.payments, label: 'Payments', icon: CreditCard },
  { href: adminRoutes.users, label: 'Users', icon: Users },
  { href: adminRoutes.memberships, label: 'Memberships', icon: BadgeCheck },
  { href: adminRoutes.operations, label: 'Operations', icon: Activity },
  { href: adminRoutes.audit, label: 'Audit', icon: ClipboardList },
  { href: adminRoutes.launchReadiness, label: 'Launch Readiness', icon: Rocket },
  { href: '#', label: 'Settings', icon: Settings, disabled: true },
] as const;

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin navigation">
      <div className="mb-4 px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Invitations</p>
        <p className="text-sm font-medium">Admin Panel</p>
      </div>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === adminRoutes.dashboard
            ? pathname === adminRoutes.dashboard
            : pathname.startsWith(item.href) && item.href !== '#';
        if ('disabled' in item && item.disabled) {
          return (
            <span
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              aria-disabled="true"
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
