export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  orderId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: string | null;
  errorCode: string | null;
  errorDesc: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreateData {
  orderId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method?: string | null;
  errorCode?: string | null;
  errorDesc?: string | null;
}

export interface PaymentUpdateData {
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  status?: PaymentStatus;
  method?: string | null;
  errorCode?: string | null;
  errorDesc?: string | null;
}

export interface VerifyPaymentInput {
  orderId: string;
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResult {
  orderId: string;
  membershipId: string;
  paymentId: string;
  alreadyCompleted: boolean;
}
