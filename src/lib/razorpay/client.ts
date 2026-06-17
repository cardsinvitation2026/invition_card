// Razorpay integration.
import 'server-only';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

function loadConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export class RazorpayService {
  isReady(): boolean {
    return loadConfig() !== null;
  }

  getConfig(): RazorpayConfig | null {
    return loadConfig();
  }
}

export const razorpayService = new RazorpayService();
