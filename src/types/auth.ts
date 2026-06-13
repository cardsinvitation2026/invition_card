import type { AppUser, UserRole, UserStatus } from './user';

export type AuthProvider = 'google' | 'dev';

export interface AuthSession {
  userId: string;
  firebaseUid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithDev: (email?: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  devModeEnabled: boolean;
}
