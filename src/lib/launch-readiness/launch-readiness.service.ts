import 'server-only';
import { cloudinaryReadinessService } from '@/lib/launch-readiness/cloudinary-readiness.service';
import { databaseReadinessService } from '@/lib/launch-readiness/database-readiness.service';
import { disasterRecoveryService } from '@/lib/launch-readiness/disaster-recovery.service';
import { environmentReadinessService } from '@/lib/launch-readiness/environment-readiness.service';
import { isCriticalFailure } from '@/lib/launch-readiness/readiness.types';
import { razorpayReadinessService } from '@/lib/launch-readiness/razorpay-readiness.service';
import { securityReadinessService } from '@/lib/launch-readiness/security-readiness.service';
import { verificationReadinessService } from '@/lib/launch-readiness/verification-readiness.service';
import { workerReadinessService } from '@/lib/launch-readiness/worker-readiness.service';
import type { LaunchDecisionStatus, LaunchReadinessSnapshot } from '@/types/launch-readiness';

function collectCriticalChecks(snapshot: Omit<LaunchReadinessSnapshot, 'decision' | 'blockers' | 'warnings' | 'generatedAt'>) {
  return [
    ...snapshot.environment.checks,
    ...snapshot.database.checks,
    ...snapshot.cloudinary.checks,
    ...snapshot.razorpay.checks,
    ...snapshot.worker.checks,
    ...snapshot.security.checks,
  ].filter(isCriticalFailure);
}

function collectWarnings(snapshot: Omit<LaunchReadinessSnapshot, 'decision' | 'blockers' | 'warnings' | 'generatedAt'>) {
  const warnings: string[] = [];

  if (snapshot.environment.mode === 'development') {
    warnings.push('Development mode: environment checks are informational only.');
  }

  if (snapshot.environment.missingVariables.length > 0) {
    warnings.push(
      `Missing production variables: ${snapshot.environment.missingVariables.join(', ')}`,
    );
  }

  if (!snapshot.worker.running) {
    warnings.push('Render worker is not currently running.');
  }

  const unknownSuites = snapshot.verification.suites.filter((suite) => suite.status === 'UNKNOWN');
  if (unknownSuites.length > 0) {
    warnings.push(
      `${unknownSuites.length} verification suite(s) require manual or CI execution.`,
    );
  }

  return warnings;
}

function resolveLaunchDecision(
  snapshot: Omit<LaunchReadinessSnapshot, 'decision' | 'blockers' | 'warnings' | 'generatedAt'>,
): { decision: LaunchDecisionStatus; blockers: string[] } {
  const isProduction = snapshot.environment.mode === 'production';
  const criticalFailures = collectCriticalChecks(snapshot);
  const blockers = criticalFailures.map((check) => `${check.label}: ${check.message}`);

  if (isProduction && snapshot.environment.missingVariables.length > 0) {
    blockers.push('Mandatory production environment variables are missing.');
  }

  if (!snapshot.database.connected && snapshot.database.prismaAvailable) {
    blockers.push('Database is unavailable.');
  }

  if (!snapshot.cloudinary.configured) {
    blockers.push('Cloudinary is unavailable.');
  }

  if (!snapshot.razorpay.configured) {
    blockers.push('Razorpay is unavailable.');
  }

  if (!snapshot.worker.running) {
    blockers.push('Worker is unavailable.');
  }

  const decision: LaunchDecisionStatus = blockers.length === 0 ? 'READY' : 'NOT_READY';
  return { decision, blockers: [...new Set(blockers)] };
}

export async function getLaunchReadinessSnapshot(): Promise<LaunchReadinessSnapshot> {
  const environment = environmentReadinessService.evaluateEnvironmentReadiness();
  const database = await databaseReadinessService.evaluateDatabaseReadiness();
  const cloudinary = cloudinaryReadinessService.evaluateCloudinaryReadiness();
  const razorpay = razorpayReadinessService.evaluateRazorpayReadiness();
  const worker = await workerReadinessService.evaluateWorkerReadiness();
  const security = securityReadinessService.evaluateSecurityReadiness();
  const disasterRecovery = disasterRecoveryService.getDisasterRecoveryChecklist();
  const verification = verificationReadinessService.evaluateVerificationReadiness();

  const partial = {
    environment,
    database,
    cloudinary,
    razorpay,
    worker,
    security,
    disasterRecovery,
    verification,
  };

  const { decision, blockers } = resolveLaunchDecision(partial);
  const warnings = collectWarnings(partial);

  return {
    decision,
    blockers,
    warnings,
    generatedAt: new Date().toISOString(),
    ...partial,
  };
}

export const launchReadinessService = {
  getLaunchReadinessSnapshot,
};
