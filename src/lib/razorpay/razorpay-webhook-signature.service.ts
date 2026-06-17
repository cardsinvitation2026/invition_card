import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

function loadWebhookSecret(): string | null {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !secret.trim()) {
    return null;
  }
  return secret;
}

export function computeWebhookSignature(rawBody: string, webhookSecret: string): string {
  return createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
}

export const razorpayWebhookSignatureService = {
  getWebhookSecret(): string | null {
    return loadWebhookSecret();
  },

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = loadWebhookSecret();
    if (!secret || !signature) {
      return false;
    }

    const expected = computeWebhookSignature(rawBody, secret);

    try {
      const expectedBuf = Buffer.from(expected, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');
      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }
      return timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  },
};
