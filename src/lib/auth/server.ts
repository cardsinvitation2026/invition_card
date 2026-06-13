// Server-side helpers usable in route handlers and React server components.
// NEVER import this file from a client component.
import 'server-only';
import { cookies } from 'next/headers';
import { APP_SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from './constants';
import { signSessionJwt, verifySessionJwt } from './session';
import type { AuthSession } from '@/types/auth';

export async function getServerSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const token = store.get(APP_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionJwt(token);
}

export async function setSessionCookie(session: AuthSession): Promise<void> {
  const jwt = await signSessionJwt(session);
  const store = await cookies();
  store.set({
    name: APP_SESSION_COOKIE,
    value: jwt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: APP_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  if (session.status !== 'ACTIVE') {
    throw new Error('USER_NOT_ACTIVE');
  }
  return session;
}

export async function requireSuperAdmin(): Promise<AuthSession> {
  const session = await requireSession();
  if (session.role !== 'SUPER_ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return session;
}
