import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { razorpayService } from '@/lib/razorpay/client';

export function buildRazorpaySignaturePayload(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): string {
  return `${razorpayOrderId}|${razorpayPaymentId}`;
}

export function computeRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  keySecret: string,
): string {
  const payload = buildRazorpaySignaturePayload(razorpayOrderId, razorpayPaymentId);
  return createHmac('sha256', keySecret).update(payload).digest('hex');
}

export const razorpaySignatureService = {
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    const config = razorpayService.getConfig();
    if (!config) {
      return false;
    }

    const expected = computeRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      config.keySecret,
    );

    try {
      const expectedBuf = Buffer.from(expected, 'utf8');
      const actualBuf = Buffer.from(razorpaySignature, 'utf8');
      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }
      return timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  },
};
