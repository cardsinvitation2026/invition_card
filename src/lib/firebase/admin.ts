// Firebase Admin SDK. Server-only, lazy init. Safe when creds missing.
import 'server-only';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { hasFirebaseAdminConfig } from '@/lib/auth/dev-mode';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

export function isFirebaseAdminReady(): boolean {
  return hasFirebaseAdminConfig();
}

function initAdmin(): App {
  if (!hasFirebaseAdminConfig()) {
    throw new Error(
      'Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.',
    );
  }
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

export function getFirebaseAdminApp(): App {
  if (!adminApp) adminApp = initAdmin();
  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  if (!adminAuth) adminAuth = getAuth(getFirebaseAdminApp());
  return adminAuth;
}

export interface VerifiedIdToken {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedIdToken> {
  const auth = getFirebaseAdminAuth();
  const decoded = await auth.verifyIdToken(idToken, true);
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: (decoded.name as string | undefined) ?? null,
    picture: (decoded.picture as string | undefined) ?? null,
  };
}
