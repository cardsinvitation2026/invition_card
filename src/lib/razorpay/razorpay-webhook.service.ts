import 'server-only';
import { paymentVerificationService } from '@/features/payments';
import type {
  RazorpayWebhookBody,
  RazorpayWebhookProcessResult,
} from '@/lib/razorpay/razorpay-webhook.types';
import type { RazorpayWebhookBodyValidated } from '@/validations/razorpay-webhook.validation';

export const razorpayWebhookService = {
  async processWebhookEvent(
    body: RazorpayWebhookBodyValidated,
  ): Promise<RazorpayWebhookProcessResult> {
    if (body.event !== 'payment.captured') {
      return { received: true, processed: false };
    }

    const entity = body.payload?.payment?.entity;
    if (!entity) {
      throw new Error('Invalid payment.captured payload');
    }

    const result = await paymentVerificationService.processCapturedPayment({
      razorpayPaymentId: entity.id,
      razorpayOrderId: entity.order_id,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
    });

    return {
      received: true,
      processed: true,
      alreadyCompleted: result.alreadyCompleted,
    };
  },
};

export type { RazorpayWebhookBody };
