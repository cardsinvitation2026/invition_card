import type { ApiResponse } from '@/types/api';
import type { CreateCheckoutOrderResult } from '@/types/order';
import type { VerifyPaymentResult } from '@/types/payment';
import type { VerifyPaymentInputValidated } from '@/validations/payment.validation';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser'));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export async function createCheckoutOrder(planId: string): Promise<CreateCheckoutOrderResult> {
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  const data = (await res.json()) as ApiResponse<CreateCheckoutOrderResult>;
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? 'Failed to create order');
  }
  return data.data;
}

export async function verifyPayment(
  input: VerifyPaymentInputValidated,
): Promise<VerifyPaymentResult> {
  const res = await fetch('/api/payments/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as ApiResponse<VerifyPaymentResult>;
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? 'Failed to verify payment');
  }
  return data.data;
}

export async function openMembershipCheckout(input: {
  planId: string;
  planName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}): Promise<void> {
  await loadRazorpayScript();
  const checkout = await createCheckoutOrder(input.planId);

  if (!window.Razorpay) {
    throw new Error('Razorpay is not available');
  }

  const rzp = new window.Razorpay({
    key: checkout.razorpayKeyId,
    amount: checkout.amount,
    currency: checkout.currency,
    name: 'My Invitations',
    description: input.planName,
    order_id: checkout.razorpayOrderId,
    handler: async (response) => {
      try {
        await verifyPayment({
          orderId: checkout.orderId,
          planId: input.planId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        input.onSuccess();
      } catch (error) {
        input.onError(error instanceof Error ? error.message : 'Payment verification failed');
      }
    },
    modal: {
      ondismiss: () => {
        input.onError('Payment cancelled');
      },
    },
    theme: { color: '#b45309' },
  });

  rzp.on('payment.failed', (response) => {
    input.onError(response.error.description);
  });

  rzp.open();
}
