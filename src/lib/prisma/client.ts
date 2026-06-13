// Prisma client singleton. Lazy + safe when DATABASE_URL is missing.
import 'server-only';
import { PrismaClient } from '@prisma/client';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export function getPrisma(): PrismaClient | null {
  if (!hasDatabaseUrl()) return null;
  if (!globalThis.__prisma__) {
    globalThis.__prisma__ = createClient();
  }
  return globalThis.__prisma__;
}

export function isPrismaAvailable(): boolean {
  return hasDatabaseUrl();
}
