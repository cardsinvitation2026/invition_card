import 'server-only';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { VerificationReadinessSnapshot, VerificationSuiteItem } from '@/types/launch-readiness';

const REQUIRED_VERIFICATION_SCRIPTS: Array<{ script: string; label: string }> = [
  { script: 'payments:verify', label: 'Payments (13A)' },
  { script: 'webhook:verify', label: 'Webhook (16A)' },
  { script: 'membership:verify', label: 'Membership (12A)' },
  { script: 'downloads:verify', label: 'Downloads (14A)' },
  { script: 'downloads:security:verify', label: 'Download security (16E)' },
  { script: 'delivery:verify', label: 'Secure delivery (16H)' },
  { script: 'worker:verify', label: 'Worker (16B)' },
  { script: 'reliability:verify', label: 'Reliability (16C)' },
  { script: 'claiming:verify', label: 'Distributed claiming (16G)' },
  { script: 'production:verify', label: 'Production ops (16D)' },
  { script: 'audit:verify', label: 'Audit (16I)' },
];

function loadPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> };
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

export function evaluateVerificationReadiness(): VerificationReadinessSnapshot {
  const scripts = loadPackageScripts();

  const suites: VerificationSuiteItem[] = REQUIRED_VERIFICATION_SCRIPTS.map(({ script, label }) => {
    const scriptPresent = Boolean(scripts[script]);
    return {
      script,
      label,
      scriptPresent,
      status: scriptPresent ? 'UNKNOWN' : 'FAIL',
    };
  });

  return { suites };
}

export const verificationReadinessService = {
  evaluateVerificationReadiness,
};
