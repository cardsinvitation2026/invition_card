import 'server-only';
import Razorpay from 'razorpay';
import { razorpayService } from '@/lib/razorpay/client';
import type {
  RazorpayCreateOrderParams,
  RazorpayCreateOrderResult,
} from '@/lib/razorpay/razorpay.types';

const RAZORPAY_NOT_CONFIGURED = 'Razorpay is not configured.';

function createRazorpayClient(): Razorpay {
  const config = razorpayService.getConfig();
  if (!config) {
    throw new Error(RAZORPAY_NOT_CONFIGURED);
  }
  return new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });
}

export const razorpayOrderService = {
  async createOrder(params: RazorpayCreateOrderParams): Promise<RazorpayCreateOrderResult> {
    if (!razorpayService.isReady()) {
      throw new Error(RAZORPAY_NOT_CONFIGURED);
    }

    const client = createRazorpayClient();
    const order = await client.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
    });

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  },

  getPublicKeyId(): string {
    const config = razorpayService.getConfig();
    if (!config) {
      throw new Error(RAZORPAY_NOT_CONFIGURED);
    }
    return config.keyId;
  },
};
