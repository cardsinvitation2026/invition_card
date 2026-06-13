// Stage 1: Payment type placeholder.
export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
}
