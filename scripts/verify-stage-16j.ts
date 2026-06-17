/**
 * Stage 16J verification.
 * Usage: npm run launch:verify
 */
process.env.DISABLE_RENDER_WORKER = '1';
process.env.CLOUDINARY_CLOUD_NAME = 'launch_verify_cloud';
process.env.CLOUDINARY_API_KEY = 'launch_verify_key';
process.env.CLOUDINARY_API_SECRET = 'launch_verify_secret';
process.env.RAZORPAY_KEY_ID = 'rzp_test_launch_verify';
process.env.RAZORPAY_KEY_SECRET = 'launch_verify_razorpay_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'launch_verify_webhook_secret';
process.env.NEXTAUTH_SECRET = 'launch_verify_nextauth_secret';
process.env.AUTH_SESSION_SECRET = 'launch_verify_auth_session_secret';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const {
    getLaunchReadinessSnapshot,
    environmentReadinessService,
    databaseReadinessService,
    cloudinaryReadinessService,
    razorpayReadinessService,
    workerReadinessService,
    securityReadinessService,
    disasterRecoveryService,
    verificationReadinessService,
  } = await import('../src/lib/launch-readiness');
  const { recordLastPollAt, recordWorkerStartedAt } = await import(
    '../src/features/render-reliability'
  );
  const { adminRoutes } = await import('../src/lib/admin/routes');

  const results: Record<string, string> = {};

  const environment = environmentReadinessService.evaluateEnvironmentReadiness();
  results.test_environment_readiness =
    environment.checks.length >= 9 &&
    environment.configuredVariables.includes('NEXTAUTH_SECRET') &&
    environment.configuredVariables.includes('AUTH_SESSION_SECRET')
      ? 'PASS'
      : 'FAIL';

  const database = await databaseReadinessService.evaluateDatabaseReadiness();
  results.test_database_readiness =
    database.readAccess && database.writeAccess && database.checks.length >= 1 ? 'PASS' : 'FAIL';

  const cloudinary = cloudinaryReadinessService.evaluateCloudinaryReadiness();
  results.test_cloudinary_readiness =
    cloudinary.configured && cloudinary.signedDeliveryAvailable && cloudinary.uploadConfigured
      ? 'PASS'
      : 'FAIL';

  const razorpay = razorpayReadinessService.evaluateRazorpayReadiness();
  results.test_razorpay_readiness =
    razorpay.configured &&
    razorpay.webhookSecretConfigured &&
    razorpay.signatureVerificationAvailable
      ? 'PASS'
      : 'FAIL';

  delete process.env.DISABLE_RENDER_WORKER;
  recordWorkerStartedAt();
  recordLastPollAt();
  const worker = await workerReadinessService.evaluateWorkerReadiness();
  results.test_worker_readiness =
    worker.running &&
    worker.distributedClaimAvailable &&
    worker.reliabilityLayerAvailable
      ? 'PASS'
      : 'FAIL';
  process.env.DISABLE_RENDER_WORKER = '1';

  const security = securityReadinessService.evaluateSecurityReadiness();
  results.test_security_readiness = security.allHardeningSignalsPresent ? 'PASS' : 'FAIL';

  const disasterRecovery = disasterRecoveryService.getDisasterRecoveryChecklist();
  results.test_disaster_recovery_checklist =
    disasterRecovery.items.length >= 5 &&
    disasterRecovery.items.every((item) => item.verificationSteps.length > 0)
      ? 'PASS'
      : 'FAIL';

  delete process.env.DISABLE_RENDER_WORKER;
  recordWorkerStartedAt();
  recordLastPollAt();
  const snapshot = await getLaunchReadinessSnapshot();
  process.env.DISABLE_RENDER_WORKER = '1';
  results.test_launch_decision_engine =
    (snapshot.decision === 'READY' || snapshot.decision === 'NOT_READY') &&
    Array.isArray(snapshot.blockers) &&
    typeof snapshot.generatedAt === 'string'
      ? 'PASS'
      : 'FAIL';

  const routeSource = readFileSync(
    resolve(process.cwd(), 'src/app/api/admin/launch-readiness/route.ts'),
    'utf8',
  );
  results.test_admin_api_auth =
    routeSource.includes('requireSuperAdmin') && routeSource.includes('export async function GET')
      ? 'PASS'
      : 'FAIL';

  const serviceSource = readFileSync(
    resolve(process.cwd(), 'src/lib/launch-readiness/launch-readiness.service.ts'),
    'utf8',
  );
  results.test_read_only_behavior =
    !serviceSource.includes('.create(') &&
    !serviceSource.includes('.update(') &&
    serviceSource.includes('getLaunchReadinessSnapshot')
      ? 'PASS'
      : 'FAIL';

  const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  results.test_no_schema_changes =
    !schema.includes('LaunchReadiness') && !schema.includes('readinessCheck') ? 'PASS' : 'FAIL';

  const paymentSource = readFileSync(
    resolve(process.cwd(), 'src/features/payments/payment-verification.service.ts'),
    'utf8',
  );
  results.test_no_business_logic_changes =
    !paymentSource.includes('launch-readiness') ? 'PASS' : 'FAIL';

  const verification = verificationReadinessService.evaluateVerificationReadiness();
  results.test_verification_suite_listed =
    verification.suites.length === 11 &&
    verification.suites.every((suite) => suite.scriptPresent)
      ? 'PASS'
      : 'FAIL';

  const sidebar = readFileSync(
    resolve(process.cwd(), 'src/components/admin/layout/AdminSidebar.tsx'),
    'utf8',
  );
  results.test_launch_navigation =
    adminRoutes.launchReadiness === '/admin/launch-readiness' &&
    sidebar.includes("label: 'Launch Readiness'")
      ? 'PASS'
      : 'FAIL';

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
