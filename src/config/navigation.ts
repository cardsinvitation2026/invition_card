import { routes } from './routes';

export interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: 'Templates', href: routes.templates },
  { label: 'Pricing', href: routes.pricing },
];

export const accountNav: NavItem[] = [
  { label: 'Dashboard', href: routes.dashboard, requiresAuth: true },
  { label: 'Admin', href: routes.admin, requiresAuth: true, adminOnly: true },
];
