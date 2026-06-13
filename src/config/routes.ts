export const routes = {
  home: '/',
  templates: '/templates',
  templateDetail: (slug: string) => `/templates/${slug}`,
  categories: '/categories',
  categoryDetail: (slug: string) => `/categories/${slug}`,
  preview: (slug: string) => `/preview/${slug}`,
  pricing: '/pricing',
  login: '/login',
  dashboard: '/dashboard',
  admin: '/admin',
} as const;

export type AppRoute = string;
