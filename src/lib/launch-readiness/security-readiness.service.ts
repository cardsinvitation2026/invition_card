import 'server-only';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createReadinessCheck } from '@/lib/launch-readiness/readiness.types';
import type { SecurityReadinessSnapshot } from '@/types/launch-readiness';

function fileIncludes(relativePath: string, needles: string[]): boolean {
  try {
    const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');
    return needles.every((needle) => source.includes(needle));
  } catch {
    return false;
  }
}

export function evaluateSecurityReadiness(): SecurityReadinessSnapshot {
  const signals = {
    signedDelivery: fileIncludes('src/lib/cloudinary/cloudinary-delivery.service.ts', [
      'generateSignedVideoUrl',
    ]),
    finalUrlRedaction: fileIncludes('src/features/render-jobs/customer-render-job.ts', [
      'finalUrl: null',
    ]),
    downloadQuota: fileIncludes(
      'src/features/download-logs/prisma-download-log.repository.ts',
      ['recordDownloadWithQuotaConsumption'],
    ) || fileIncludes('src/features/download-logs/inmemory-download-log.repository.ts', [
      'recordDownloadWithQuotaConsumption',
    ]),
    paymentHardening: fileIncludes('src/features/payments/payment-fulfillment.engine.ts', [
      'fulfillPurchaseHardened',
    ]),
    distributedClaiming: fileIncludes('src/features/render-worker/render-worker.service.ts', [
      'claimPendingRenderJob',
    ]),
    webhookSignature: fileIncludes(
      'src/lib/razorpay/razorpay-webhook-signature.service.ts',
      ['verifyWebhookSignature'],
    ),
  };

  const checks = [
    createReadinessCheck({
      id: 'security_signed_delivery',
      label: 'Signed video delivery',
      status: signals.signedDelivery ? 'pass' : 'fail',
      critical: true,
      message: signals.signedDelivery ? 'Stage 16H delivery layer present' : 'Missing signed delivery',
    }),
    createReadinessCheck({
      id: 'security_finalurl_redaction',
      label: 'Customer finalUrl redaction',
      status: signals.finalUrlRedaction ? 'pass' : 'fail',
      critical: true,
      message: signals.finalUrlRedaction ? 'Customer finalUrl redaction active' : 'Redaction missing',
    }),
    createReadinessCheck({
      id: 'security_download_quota',
      label: 'Download quota enforcement',
      status: signals.downloadQuota ? 'pass' : 'fail',
      critical: true,
      message: signals.downloadQuota ? 'Quota enforcement path present' : 'Quota enforcement missing',
    }),
    createReadinessCheck({
      id: 'security_payment_hardening',
      label: 'Payment fulfillment hardening',
      status: signals.paymentHardening ? 'pass' : 'fail',
      critical: true,
      message: signals.paymentHardening ? 'Stage 16F hardening present' : 'Payment hardening missing',
    }),
    createReadinessCheck({
      id: 'security_distributed_claiming',
      label: 'Distributed render claiming',
      status: signals.distributedClaiming ? 'pass' : 'fail',
      critical: true,
      message: signals.distributedClaiming ? 'Stage 16G claiming present' : 'Claiming missing',
    }),
    createReadinessCheck({
      id: 'security_webhook_signature',
      label: 'Webhook signature verification',
      status: signals.webhookSignature ? 'pass' : 'fail',
      critical: true,
      message: signals.webhookSignature
        ? 'Webhook signature verification present'
        : 'Webhook verification missing',
    }),
  ];

  const allHardeningSignalsPresent = Object.values(signals).every(Boolean);

  return {
    checks,
    allHardeningSignalsPresent,
  };
}

export const securityReadinessService = {
  evaluateSecurityReadiness,
};
