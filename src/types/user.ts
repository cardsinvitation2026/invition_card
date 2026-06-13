export type UserRole = 'USER' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface AppUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUserInput {
  firebaseUid: string;
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}
