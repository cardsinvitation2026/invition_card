// Centralized route paths. Pages will be added in later stages.
export const routes = {
  home: '/',
  templates: '/templates',
  pricing: '/pricing',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  admin: '/admin',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
