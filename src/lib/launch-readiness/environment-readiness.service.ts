import 'server-only';
import { createReadinessCheck } from '@/lib/launch-readiness/readiness.types';
import type { EnvironmentReadinessSnapshot } from '@/types/launch-readiness';

export const LAUNCH_MANDATORY_ENV_VARIABLES = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'AUTH_SESSION_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
] as const;

function isConfigured(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

export function evaluateEnvironmentReadiness(): EnvironmentReadinessSnapshot {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingVariables = LAUNCH_MANDATORY_ENV_VARIABLES.filter((name) => !isConfigured(name));
  const configuredVariables = LAUNCH_MANDATORY_ENV_VARIABLES.filter((name) => isConfigured(name));

  const checks = LAUNCH_MANDATORY_ENV_VARIABLES.map((name) =>
    createReadinessCheck({
      id: `env_${name.toLowerCase()}`,
      label: name,
      status: isConfigured(name) ? 'pass' : 'fail',
      critical: isProduction,
      message: isConfigured(name) ? 'Configured' : 'Missing or empty',
    }),
  );

  const productionValid = missingVariables.length === 0;

  return {
    mode: isProduction ? 'production' : 'development',
    blocking: isProduction && !productionValid,
    checks,
    missingVariables: [...missingVariables],
    configuredVariables: [...configuredVariables],
  };
}

export const environmentReadinessService = {
  evaluateEnvironmentReadiness,
};
