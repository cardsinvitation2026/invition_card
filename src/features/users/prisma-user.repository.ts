// Prisma-backed UserRepository. Used when DATABASE_URL is populated.
import 'server-only';
import type { UserRepository } from './user.repository';
import type { AppUser, UpsertUserInput } from '@/types/user';
import { getPrisma } from '@/lib/prisma/client';

function toAppUser(row: {
  id: string;
  firebaseUid: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): AppUser {
  return {
    id: row.id,
    firebaseUid: row.firebaseUid,
    email: row.email,
    name: row.name,
    photoUrl: row.photoUrl,
    role: row.role as AppUser['role'],
    status: row.status as AppUser['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function db() {
  const client = getPrisma();
  if (!client) throw new Error('Prisma client unavailable (DATABASE_URL not set).');
  return client;
}

export const prismaUserRepository: UserRepository = {
  async findById(id) {
    const row = await db().user.findUnique({ where: { id } });
    return row ? toAppUser(row) : null;
  },
  async findByFirebaseUid(firebaseUid) {
    const row = await db().user.findUnique({ where: { firebaseUid } });
    return row ? toAppUser(row) : null;
  },
  async findByEmail(email) {
    const row = await db().user.findUnique({ where: { email } });
    return row ? toAppUser(row) : null;
  },
  async upsertFromAuth(input: UpsertUserInput) {
    const row = await db().user.upsert({
      where: { firebaseUid: input.firebaseUid },
      update: {
        email: input.email,
        name: input.name ?? undefined,
        photoUrl: input.photoUrl ?? undefined,
      },
      create: {
        firebaseUid: input.firebaseUid,
        email: input.email,
        name: input.name ?? null,
        photoUrl: input.photoUrl ?? null,
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    return toAppUser(row);
  },
  async setRole(id, role) {
    const row = await db().user.update({ where: { id }, data: { role } });
    return toAppUser(row);
  },
  async setStatus(id, status) {
    const row = await db().user.update({ where: { id }, data: { status } });
    return toAppUser(row);
  },
};
