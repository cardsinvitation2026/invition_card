import 'server-only';
import { razorpayService } from '@/lib/razorpay/client';
import { razorpaySignatureService } from '@/lib/razorpay/razorpay-signature.service';
import { razorpayWebhookSignatureService } from '@/lib/razorpay/razorpay-webhook-signature.service';
import { createReadinessCheck } from '@/lib/launch-readiness/readiness.types';
import type { RazorpayReadinessSnapshot } from '@/types/launch-readiness';

function webhookSecretConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
}

export function evaluateRazorpayReadiness(): RazorpayReadinessSnapshot {
  const configured = razorpayService.isReady();
  const webhookSecret = webhookSecretConfigured();
  const checkoutAvailable = configured;
  const signatureVerificationAvailable =
    typeof razorpaySignatureService.verifyPaymentSignature === 'function' &&
    typeof razorpayWebhookSignatureService.verifyWebhookSignature === 'function';

  const checks = [
    createReadinessCheck({
      id: 'razorpay_configured',
      label: 'Razorpay configuration',
      status: configured ? 'pass' : 'fail',
      critical: true,
      message: configured ? 'Razorpay credentials configured' : 'Razorpay credentials missing',
    }),
    createReadinessCheck({
      id: 'razorpay_webhook_secret',
      label: 'Webhook secret',
      status: webhookSecret ? 'pass' : 'fail',
      critical: true,
      message: webhookSecret ? 'Webhook secret configured' : 'Webhook secret missing',
    }),
    createReadinessCheck({
      id: 'razorpay_checkout',
      label: 'Checkout configuration',
      status: checkoutAvailable ? 'pass' : 'fail',
      critical: true,
      message: checkoutAvailable ? 'Checkout keys available' : 'Checkout keys unavailable',
    }),
    createReadinessCheck({
      id: 'razorpay_signature_verification',
      label: 'Signature verification',
      status: signatureVerificationAvailable ? 'pass' : 'fail',
      critical: true,
      message: signatureVerificationAvailable
        ? 'Payment and webhook signature verification available'
        : 'Signature verification unavailable',
    }),
  ];

  return {
    checks,
    configured,
    webhookSecretConfigured: webhookSecret,
    checkoutAvailable,
    signatureVerificationAvailable,
  };
}

export const razorpayReadinessService = {
  evaluateRazorpayReadiness,
};
