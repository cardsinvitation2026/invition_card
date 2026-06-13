// Razorpay integration placeholder.
import 'server-only';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export class RazorpayService {
  constructor(private readonly config: RazorpayConfig | null) {}
  isReady(): boolean {
    return this.config !== null;
  }
  // Future: createOrder, verifyWebhook, refund, ...
}

function loadConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export const razorpayService = new RazorpayService(loadConfig());
