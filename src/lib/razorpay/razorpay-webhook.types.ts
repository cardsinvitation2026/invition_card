export type RazorpayWebhookEventName =
  | 'payment.captured'
  | 'payment.authorized'
  | 'payment.failed'
  | string;

export interface RazorpayWebhookPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayWebhookPayload {
  payment?: {
    entity?: RazorpayWebhookPaymentEntity;
  };
}

export interface RazorpayWebhookBody {
  event: RazorpayWebhookEventName;
  payload?: RazorpayWebhookPayload;
}

export interface RazorpayWebhookProcessResult {
  received: true;
  processed: boolean;
  alreadyCompleted?: boolean;
}

export interface PaymentCapturedInput {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}
