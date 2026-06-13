// Stage 1: User type placeholder.
export type UserRole = 'user' | 'admin';
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
}
