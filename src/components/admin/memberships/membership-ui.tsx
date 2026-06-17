'use client';

import { formatDownloadLimit } from '@/components/admin/payments/payment-ui';

export function displayUserLabel(name: string | null, email: string): string {
  return name?.trim() ? name : email;
}

export function formatRemainingDownloads(
  downloadLimit: number | null,
  remainingLabel: string,
): string {
  if (downloadLimit === null) {
    return 'Unlimited';
  }
  return remainingLabel;
}

export { formatDownloadLimit };
