// HS256 JWT session cookie helpers (jose, edge-runtime safe).
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { AuthSession } from '@/types/auth';
import type { UserRole, UserStatus } from '@/types/user';
import { SESSION_MAX_AGE_SECONDS } from './constants';

function getSecret(): Uint8Array {
  const raw =
    process.env.AUTH_SESSION_SECRET ?? 'dev-only-do-not-use-in-prod-change-me-pls-32';
  if (raw.length < 32) {
    // jose tolerates shorter, but enforce a sane minimum even in dev.
    return new TextEncoder().encode(raw.padEnd(32, '_'));
  }
  return new TextEncoder().encode(raw);
}

export async function signSessionJwt(
  payload: AuthSession,
  expiresInSeconds: number = SESSION_MAX_AGE_SECONDS,
): Promise<string> {
  const jwtPayload: JWTPayload = {
    sub: payload.userId,
    firebaseUid: payload.firebaseUid,
    email: payload.email,
    role: payload.role,
    status: payload.status,
    provider: payload.provider,
  };

  return new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(getSecret());
}

export async function verifySessionJwt(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.firebaseUid !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }
    return {
      userId: payload.sub,
      firebaseUid: payload.firebaseUid as string,
      email: payload.email as string,
      role: (payload.role as UserRole) ?? 'USER',
      status: (payload.status as UserStatus) ?? 'ACTIVE',
      provider: (payload.provider as AuthSession['provider']) ?? 'google',
    };
  } catch {
    return null;
  }
}
