/**
 * Manual Stage 10B render execution script.
 * Usage: npx tsx scripts/execute-render-job.ts <userId> <jobId>
 */
import { renderJobService } from '../src/features/render-jobs';

async function main() {
  const userId = process.argv[2];
  const jobId = process.argv[3];

  if (!userId || !jobId) {
    console.error('Usage: npx tsx scripts/execute-render-job.ts <userId> <jobId>');
    process.exit(1);
  }

  const session = {
    userId,
    firebaseUid: 'script',
    email: 'script@local',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    provider: 'dev' as const,
  };

  const result = await renderJobService.executeRenderJob(session, jobId);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
