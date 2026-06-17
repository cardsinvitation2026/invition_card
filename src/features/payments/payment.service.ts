import 'server-only';
import type { PaymentRepository } from './payment.repository';
import { prismaPaymentRepository } from './prisma-payment.repository';
import { inMemoryPaymentRepository } from './inmemory-payment.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { membershipPlanService } from '@/features/membership-plans';
import { orderService } from '@/features/orders';
import { razorpayOrderService } from '@/lib/razorpay/razorpay-order.service';
import type { CreateCheckoutOrderResult } from '@/types/order';
import type { PaymentCreateData, PaymentUpdateData } from '@/types/payment';
import type { CreateCheckoutOrderInput } from '@/validations/order.validation';

function repo(): PaymentRepository {
  return hasDatabaseUrl() ? prismaPaymentRepository : inMemoryPaymentRepository;
}

export const paymentService = {
  async getPayment(id: string) {
    return repo().findById(id);
  },

  async getPaymentByOrderId(orderId: string) {
    return repo().findByOrderId(orderId);
  },

  async getPaymentByRazorpayPaymentId(razorpayPaymentId: string) {
    return repo().findByRazorpayPaymentId(razorpayPaymentId);
  },

  async createPayment(input: PaymentCreateData) {
    return repo().create(input);
  },

  async updatePayment(id: string, input: PaymentUpdateData) {
    return repo().update(id, input);
  },

  async listPaymentsByOrder(orderId: string) {
    return repo().listByOrder(orderId);
  },

  async createCheckoutOrder(
    userId: string,
    input: CreateCheckoutOrderInput,
  ): Promise<CreateCheckoutOrderResult> {
    const plan = await membershipPlanService.getPlan(input.planId);
    if (!plan) {
      throw new Error('Membership plan not found');
    }
    if (!plan.active) {
      throw new Error('Membership plan is not active');
    }
    if (plan.deletedAt !== null) {
      throw new Error('Membership plan is not available');
    }

    const order = await orderService.createOrder({
      userId,
      amount: plan.price,
      currency: plan.currency,
      status: 'PENDING',
      membershipId: null,
    });

    const razorpayOrder = await razorpayOrderService.createOrder({
      amount: plan.price,
      currency: plan.currency,
      receipt: order.id,
    });

    await this.createPayment({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      status: 'PENDING',
      amount: plan.price,
      currency: plan.currency,
    });

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: plan.price,
      currency: plan.currency,
      razorpayKeyId: razorpayOrderService.getPublicKeyId(),
    };
  },
};
