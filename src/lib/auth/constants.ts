// Auth-related constants shared by client and server.
export const APP_SESSION_COOKIE = 'mi_session';
export const FIREBASE_ID_TOKEN_COOKIE = 'mi_firebase_token';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Public route prefixes (no auth required).
export const PUBLIC_PATH_PREFIXES = [
  '/',
  '/login',
  '/signup',
  '/templates',
  '/categories',
  '/preview',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon',
] as const;

// Protected route prefixes (any logged-in user).
export const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/drafts',
  '/downloads',
  '/account',
  '/membership',
  '/checkout',
] as const;

// Admin-only route prefixes.
export const ADMIN_PATH_PREFIXES = ['/admin'] as const;
