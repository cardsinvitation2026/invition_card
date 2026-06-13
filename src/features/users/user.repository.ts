// Contract every user repository must satisfy.
import type { AppUser, UpsertUserInput } from '@/types/user';

export interface UserRepository {
  findById(id: string): Promise<AppUser | null>;
  findByFirebaseUid(firebaseUid: string): Promise<AppUser | null>;
  findByEmail(email: string): Promise<AppUser | null>;
  upsertFromAuth(input: UpsertUserInput): Promise<AppUser>;
  setRole(id: string, role: AppUser['role']): Promise<AppUser>;
  setStatus(id: string, status: AppUser['status']): Promise<AppUser>;
}
