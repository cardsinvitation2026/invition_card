import type {
  Payment,
  PaymentCreateData,
  PaymentUpdateData,
} from '@/types/payment';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByRazorpayPaymentId(razorpayPaymentId: string): Promise<Payment | null>;
  create(input: PaymentCreateData): Promise<Payment>;
  update(id: string, input: PaymentUpdateData): Promise<Payment>;
  listByOrder(orderId: string): Promise<Payment[]>;
}
