// Stage 1: Auth types placeholder. Real shapes added with Firebase Auth integration.
export type AuthProvider = 'google' | 'email' | 'phone';
export interface AuthSession {
  userId: string;
  provider: AuthProvider;
}
