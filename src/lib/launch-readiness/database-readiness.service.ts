import 'server-only';
import { getPrisma } from '@/lib/prisma/client';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { createReadinessCheck } from '@/lib/launch-readiness/readiness.types';
import type { DatabaseReadinessSnapshot } from '@/types/launch-readiness';

class WriteProbeRollback extends Error {
  constructor() {
    super('WRITE_PROBE_ROLLBACK');
    this.name = 'WriteProbeRollback';
  }
}

export async function evaluateDatabaseReadiness(): Promise<DatabaseReadinessSnapshot> {
  const prisma = getPrisma();
  const prismaAvailable = hasDatabaseUrl() && Boolean(prisma);

  if (!prismaAvailable || !prisma) {
    return {
      checks: [
        createReadinessCheck({
          id: 'db_in_memory_mode',
          label: 'Database mode',
          status: 'warn',
          critical: false,
          message: 'Running without DATABASE_URL (in-memory persistence).',
        }),
      ],
      connected: true,
      prismaAvailable: false,
      readAccess: true,
      writeAccess: true,
      migrationVisibility: {
        available: false,
        appliedCount: null,
        latestMigration: null,
      },
    };
  }

  let connected = false;
  let readAccess = false;
  let writeAccess = false;
  let migrationAvailable = false;
  let appliedCount: number | null = null;
  let latestMigration: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    connected = true;
    readAccess = true;
  } catch {
    connected = false;
    readAccess = false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`CREATE TEMP TABLE IF NOT EXISTS _launch_readiness_probe (id int)`;
      await tx.$executeRaw`INSERT INTO _launch_readiness_probe (id) VALUES (1)`;
      throw new WriteProbeRollback();
    });
  } catch (error) {
    writeAccess = error instanceof WriteProbeRollback;
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1
    `;
    migrationAvailable = true;
    appliedCount = rows.length > 0 ? 1 : 0;
    latestMigration = rows[0]?.migration_name ?? null;

    const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM _prisma_migrations
    `;
    appliedCount = Number(countRows[0]?.count ?? 0);
  } catch {
    migrationAvailable = false;
  }

  const checks = [
    createReadinessCheck({
      id: 'db_connectivity',
      label: 'Database connectivity',
      status: connected ? 'pass' : 'fail',
      critical: true,
      message: connected ? 'Database reachable' : 'Database unreachable',
    }),
    createReadinessCheck({
      id: 'db_prisma',
      label: 'Prisma connectivity',
      status: connected ? 'pass' : 'fail',
      critical: true,
      message: connected ? 'Prisma client connected' : 'Prisma client unavailable',
    }),
    createReadinessCheck({
      id: 'db_read_access',
      label: 'Read access',
      status: readAccess ? 'pass' : 'fail',
      critical: true,
      message: readAccess ? 'Read probe succeeded' : 'Read probe failed',
    }),
    createReadinessCheck({
      id: 'db_write_access',
      label: 'Write access (rollback probe)',
      status: writeAccess ? 'pass' : 'fail',
      critical: true,
      message: writeAccess
        ? 'Temporary write probe rolled back successfully'
        : 'Write probe failed',
    }),
    createReadinessCheck({
      id: 'db_migration_visibility',
      label: 'Migration state visibility',
      status: migrationAvailable ? 'pass' : 'warn',
      critical: false,
      message: migrationAvailable
        ? `Observed ${appliedCount ?? 0} applied migration(s)`
        : 'Migration history unavailable',
      details: latestMigration ? [`Latest: ${latestMigration}`] : undefined,
    }),
  ];

  return {
    checks,
    connected,
    prismaAvailable,
    readAccess,
    writeAccess,
    migrationVisibility: {
      available: migrationAvailable,
      appliedCount,
      latestMigration,
    },
  };
}

export const databaseReadinessService = {
  evaluateDatabaseReadiness,
};
