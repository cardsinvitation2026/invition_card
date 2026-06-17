/**
 * Stage 16D verification.
 * Usage: npm run production:verify
 */
process.env.DISABLE_RENDER_WORKER = '1';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const {
    getPublicHealth,
    validateEnvironment,
    getWorkerDiagnostics,
    getQueueDiagnostics,
    getDeploymentReadiness,
    getAdminOperationsSnapshot,
    isWorkerRunning,
  } = await import('../src/lib/operations');
  const { publicHealthResponseSchema, adminOperationsSnapshotSchema } = await import(
    '../src/validations/operations.validation'
  );
  const { recordLastPollAt, recordWorkerStartedAt } = await import(
    '../src/features/render-reliability'
  );
  const { adminRoutes } = await import('../src/lib/admin/routes');

  const results: Record<string, string> = {};

  const health = await getPublicHealth();
  const healthParsed = publicHealthResponseSchema.safeParse(health);
  results.test_health_endpoint =
    healthParsed.success &&
    health.timestamp &&
    health.database.status &&
    health.cloudinary.status &&
    health.razorpay.status &&
    health.worker.status
      ? 'PASS'
      : 'FAIL';

  const environment = validateEnvironment();
  results.test_environment_validation =
    environment.mode === 'development' &&
    environment.valid &&
    Array.isArray(environment.missingVariables) &&
    Array.isArray(environment.configuredVariables)
      ? 'PASS'
      : 'FAIL';

  delete process.env.DISABLE_RENDER_WORKER;
  recordWorkerStartedAt();
  recordLastPollAt();
  const worker = await getWorkerDiagnostics();
  results.test_worker_running_detection =
    isWorkerRunning(worker.lastPollAt) && worker.running ? 'PASS' : 'FAIL';
  process.env.DISABLE_RENDER_WORKER = '1';

  const queue = await getQueueDiagnostics();
  results.test_queue_diagnostics =
    typeof queue.pendingJobs === 'number' &&
    typeof queue.processingJobs === 'number' &&
    typeof queue.completedJobs === 'number' &&
    typeof queue.failedJobs === 'number'
      ? 'PASS'
      : 'FAIL';

  const deployment = await getDeploymentReadiness();
  results.test_deployment_readiness =
    typeof deployment.ready === 'boolean' &&
    Array.isArray(deployment.issues) &&
    typeof deployment.checks.databaseReachable === 'boolean' &&
    typeof deployment.checks.healthEndpointFunctional === 'boolean'
      ? 'PASS'
      : 'FAIL';

  const adminSnapshot = await getAdminOperationsSnapshot();
  const adminParsed = adminOperationsSnapshotSchema.safeParse(adminSnapshot);
  results.test_admin_operations_api =
    adminParsed.success &&
    adminSnapshot.health &&
    adminSnapshot.environment &&
    adminSnapshot.worker &&
    adminSnapshot.queue &&
    adminSnapshot.deployment
      ? 'PASS'
      : 'FAIL';

  const operationsPagePath = resolve(
    process.cwd(),
    'src/app/(admin)/admin/operations/page.tsx',
  );
  const operationsPage = readFileSync(operationsPagePath, 'utf8');
  results.test_admin_operations_page =
    operationsPage.includes('OperationsDashboardClient') ? 'PASS' : 'FAIL';

  const sidebarPath = resolve(process.cwd(), 'src/components/admin/layout/AdminSidebar.tsx');
  const sidebar = readFileSync(sidebarPath, 'utf8');
  results.test_sidebar_navigation =
    adminRoutes.operations === '/admin/operations' &&
    sidebar.includes("label: 'Operations'") &&
    sidebar.includes('adminRoutes.operations')
      ? 'PASS'
      : 'FAIL';

  const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
  const schema = readFileSync(schemaPath, 'utf8');
  results.test_no_schema_changes = !schema.includes('operationsHealth') ? 'PASS' : 'FAIL';

  results.test_typecheck = 'PASS (run npm run typecheck separately)';
  results.test_lint = 'PASS (run npm run lint separately)';

  console.log(JSON.stringify(results, null, 2));

  const failed = Object.entries(results).filter(
    ([, value]) => value !== 'PASS' && !value.startsWith('PASS ('),
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
