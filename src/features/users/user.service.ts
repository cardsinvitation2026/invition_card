// User service — business logic on top of UserRepository.
import 'server-only';
import type { UserRepository } from './user.repository';
import { prismaUserRepository } from './prisma-user.repository';
import { inMemoryUserRepository } from './inmemory-user.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type { AppUser, UpsertUserInput } from '@/types/user';

function repo(): UserRepository {
  return hasDatabaseUrl() ? prismaUserRepository : inMemoryUserRepository;
}

export const userService = {
  async syncFromAuth(input: UpsertUserInput): Promise<AppUser> {
    return repo().upsertFromAuth(input);
  },
  async getById(id: string): Promise<AppUser | null> {
    return repo().findById(id);
  },
  async getByFirebaseUid(uid: string): Promise<AppUser | null> {
    return repo().findByFirebaseUid(uid);
  },
  async promoteToSuperAdmin(id: string): Promise<AppUser> {
    return repo().setRole(id, 'SUPER_ADMIN');
  },
  async block(id: string): Promise<AppUser> {
    return repo().setStatus(id, 'BLOCKED');
  },
  async activate(id: string): Promise<AppUser> {
    return repo().setStatus(id, 'ACTIVE');
  },
  isUsingDatabase(): boolean {
    return hasDatabaseUrl();
  },
};
