import { routes as r } from './routes';
export interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: 'Templates', href: r.templates },
  { label: 'Categories', href: r.categories },
  { label: 'Pricing', href: r.pricing },
];

export const footerLegal: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];
