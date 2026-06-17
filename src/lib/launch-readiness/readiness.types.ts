import type { ReadinessCheckItem, ReadinessCheckStatus } from '@/types/launch-readiness';

export type { ReadinessCheckItem, ReadinessCheckStatus };

export function createReadinessCheck(input: ReadinessCheckItem): ReadinessCheckItem {
  return { ...input, details: input.details ? [...input.details] : undefined };
}

export function isCheckPassing(status: ReadinessCheckStatus): boolean {
  return status === 'pass';
}

export function isCriticalFailure(check: ReadinessCheckItem): boolean {
  return check.critical && check.status === 'fail';
}
