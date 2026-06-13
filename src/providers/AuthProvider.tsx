// AuthProvider: single source of truth for client auth state.
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { firebaseAuthService } from '@/services/auth/firebase-auth.service';
import { isAuthDevModeClient } from '@/lib/auth/dev-mode';
import type { AppUser } from '@/types/user';
import type { AuthContextValue } from '@/types/auth';

const AuthCtx = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<AppUser | null> {
  const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
  if (!res.ok) return null;
  const data = (await res.json()) as { success: boolean; data: { user: AppUser | null } };
  return data?.data?.user ?? null;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  const devModeEnabled = isAuthDevModeClient();

  const refresh = useCallback(async () => {
    setError(null);
    const me = await fetchMe();
    setUser(me);
  }, []);

  // Bootstrap: read /api/auth/me + consume Firebase redirect result if any.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    (async () => {
      try {
        if (firebaseAuthService.isConfigured()) {
          const redirect = await firebaseAuthService.consumeRedirectResult();
          if (redirect) {
            await postJson<{ success: boolean; data: { user: AppUser } }>(
              '/api/auth/sync',
              { idToken: redirect.idToken },
            );
          }
        }
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Auth bootstrap failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  // Keep server session fresh as Firebase rotates ID tokens.
  useEffect(() => {
    if (!firebaseAuthService.isConfigured()) return;
    const unsub = firebaseAuthService.onIdTokenChanged(async (fbUser) => {
      if (!fbUser) return;
      try {
        const idToken = await fbUser.getIdToken();
        await postJson<{ success: boolean }>('/api/auth/sync', { idToken });
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sync failed');
      }
    });
    return () => unsub();
  }, [refresh]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const out = await firebaseAuthService.signInWithGoogle();
      if (out === 'redirected') return;
      await postJson<{ success: boolean; data: { user: AppUser } }>('/api/auth/sync', {
        idToken: out.idToken,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const signInWithDev = useCallback(
    async (email?: string, name?: string) => {
      setError(null);
      setLoading(true);
      try {
        await postJson<{ success: boolean; data: { user: AppUser } }>('/api/auth/dev-login', {
          email,
          name,
        });
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Dev sign-in failed');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseAuthService.signOut().catch(() => undefined);
      await postJson('/api/auth/logout', {});
      setUser(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-out failed');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signInWithDev,
      signOut,
      refresh,
      isAuthenticated: !!user && user.status === 'ACTIVE',
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      devModeEnabled,
    }),
    [user, loading, error, signInWithGoogle, signInWithDev, signOut, refresh, devModeEnabled],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
