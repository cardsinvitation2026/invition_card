// In-memory UserRepository — used in dev/preview when DATABASE_URL is empty.
// Persists across hot reloads via globalThis. Data is lost on server restart.
import 'server-only';
import { randomUUID } from 'node:crypto';
import type { UserRepository } from './user.repository';
import type { AppUser, UpsertUserInput } from '@/types/user';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_users__: Map<string, AppUser> | undefined;
}

function store(): Map<string, AppUser> {
  if (!globalThis.__mi_inmem_users__) {
    globalThis.__mi_inmem_users__ = new Map();
  }
  return globalThis.__mi_inmem_users__;
}

function findBy(predicate: (u: AppUser) => boolean): AppUser | null {
  for (const u of store().values()) {
    if (predicate(u)) return u;
  }
  return null;
}

export const inMemoryUserRepository: UserRepository = {
  async findById(id) {
    return store().get(id) ?? null;
  },
  async findByFirebaseUid(firebaseUid) {
    return findBy((u) => u.firebaseUid === firebaseUid);
  },
  async findByEmail(email) {
    return findBy((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  async upsertFromAuth(input: UpsertUserInput) {
    const existing = findBy((u) => u.firebaseUid === input.firebaseUid);
    const now = new Date().toISOString();
    if (existing) {
      const updated: AppUser = {
        ...existing,
        email: input.email,
        name: input.name ?? existing.name,
        photoUrl: input.photoUrl ?? existing.photoUrl,
        updatedAt: now,
      };
      store().set(existing.id, updated);
      return updated;
    }
    const created: AppUser = {
      id: randomUUID(),
      firebaseUid: input.firebaseUid,
      email: input.email,
      name: input.name ?? null,
      photoUrl: input.photoUrl ?? null,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    return created;
  },
  async setRole(id, role) {
    const u = store().get(id);
    if (!u) throw new Error('User not found');
    const updated = { ...u, role, updatedAt: new Date().toISOString() };
    store().set(id, updated);
    return updated;
  },
  async setStatus(id, status) {
    const u = store().get(id);
    if (!u) throw new Error('User not found');
    const updated = { ...u, status, updatedAt: new Date().toISOString() };
    store().set(id, updated);
    return updated;
  },
};
