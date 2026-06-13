// Centralised feature-flag helpers. All checks read from env.
// IMPORTANT: only NEXT_PUBLIC_* values may be referenced in client modules.

export function isAuthDevModeServer(): boolean {
  return process.env.AUTH_DEV_MODE === 'true';
}

export function isAuthDevModeClient(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true';
}

export function hasFirebaseClientConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

export function hasFirebaseAdminConfig(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function hasDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0);
}
