import 'server-only';
import type { EnvironmentValidationResult } from '@/types/operations';

export const PRODUCTION_REQUIRED_ENV_VARIABLES = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
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

export function validateEnvironment(): EnvironmentValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingVariables = PRODUCTION_REQUIRED_ENV_VARIABLES.filter(
    (name) => !isConfigured(name),
  );
  const configuredVariables = PRODUCTION_REQUIRED_ENV_VARIABLES.filter((name) =>
    isConfigured(name),
  );

  return {
    mode: isProduction ? 'production' : 'development',
    valid: !isProduction || missingVariables.length === 0,
    missingVariables: [...missingVariables],
    configuredVariables: [...configuredVariables],
  };
}

export const environmentCheckService = {
  validateEnvironment,
};
