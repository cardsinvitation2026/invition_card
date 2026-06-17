import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { membershipPlanService } from '@/features/membership-plans';
import { orderService } from '@/features/orders';
import { paymentService } from '@/features/payments/payment.service';
import { fulfillPurchaseHardened } from '@/features/payments/payment-fulfillment.engine';
import { razorpaySignatureService } from '@/lib/razorpay/razorpay-signature.service';
import type { PaymentCapturedInput } from '@/lib/razorpay/razorpay-webhook.types';
import type { Order } from '@/types/order';
import type { Payment, VerifyPaymentResult } from '@/types/payment';
import type { VerifyPaymentInputValidated } from '@/validations/payment.validation';

function completedResult(
  orderId: string,
  membershipId: string,
  paymentId: string,
): VerifyPaymentResult {
  return {
    orderId,
    membershipId,
    paymentId,
    alreadyCompleted: true,
  };
}

async function findPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | null> {
  if (hasDatabaseUrl()) {
    const prisma = getPrisma();
    if (prisma) {
      const row = await prisma.payment.findFirst({
        where: { razorpayOrderId },
        orderBy: { createdAt: 'desc' },
      });
      if (!row) {
        return null;
      }
      return paymentService.getPayment(row.id);
    }
    return null;
  }

  const store = globalThis.__mi_inmem_payments__ as Map<string, Payment> | undefined;
  if (!store) {
    return null;
  }

  for (const payment of store.values()) {
    if (payment.razorpayOrderId === razorpayOrderId) {
      return payment;
    }
  }
  return null;
}

async function resolveIdempotentResult(
  order: Order,
  payment: Payment | null,
  razorpayPaymentId?: string,
): Promise<VerifyPaymentResult | null> {
  if (order.status === 'COMPLETED' && order.membershipId) {
    return completedResult(order.id, order.membershipId, payment?.id ?? '');
  }

  if (order.membershipId) {
    return completedResult(order.id, order.membershipId, payment?.id ?? '');
  }

  if (payment?.status === 'SUCCESS') {
    const linkedOrder = await orderService.getOrder(payment.orderId);
    if (linkedOrder?.membershipId) {
      return completedResult(
        linkedOrder.id,
        linkedOrder.membershipId,
        payment.id,
      );
    }
  }

  if (razorpayPaymentId) {
    const existingPayment = await paymentService.getPaymentByRazorpayPaymentId(
      razorpayPaymentId,
    );
    if (existingPayment) {
      const linkedOrder = await orderService.getOrder(existingPayment.orderId);
      if (linkedOrder?.membershipId) {
        return completedResult(
          linkedOrder.id,
          linkedOrder.membershipId,
          existingPayment.id,
        );
      }
    }
  }

  return null;
}

async function resolvePlanForOrder(
  order: Order,
  explicitPlanId?: string,
) {
  if (explicitPlanId) {
    const plan = await membershipPlanService.getPlan(explicitPlanId);
    if (!plan) {
      throw new Error('Membership plan not found');
    }
    if (!plan.active || plan.deletedAt !== null) {
      throw new Error('Membership plan is not available');
    }
    if (order.amount !== plan.price || order.currency !== plan.currency) {
      throw new Error('Order amount mismatch');
    }
    return plan;
  }

  const activePlans = await membershipPlanService.listActivePlans();
  const matches = activePlans.filter(
    (plan) => plan.price === order.amount && plan.currency === order.currency,
  );
  if (matches.length !== 1) {
    throw new Error('Unable to resolve plan for order');
  }

  const plan = await membershipPlanService.getPlan(matches[0].id);
  if (!plan) {
    throw new Error('Membership plan not found');
  }
  if (!plan.active || plan.deletedAt !== null) {
    throw new Error('Membership plan is not available');
  }
  return plan;
}

async function fulfillPurchase(input: {
  order: Order;
  payment: Payment;
  planId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
}): Promise<VerifyPaymentResult> {
  const idempotent = await resolveIdempotentResult(
    input.order,
    input.payment,
    input.razorpayPaymentId,
  );
  if (idempotent) {
    return idempotent;
  }

  const freshOrder = await orderService.getOrder(input.order.id);
  const freshPayment = await paymentService.getPayment(input.payment.id);
  if (!freshOrder || !freshPayment) {
    throw new Error('Order or payment not found');
  }

  const recheck = await resolveIdempotentResult(
    freshOrder,
    freshPayment,
    input.razorpayPaymentId,
  );
  if (recheck) {
    return recheck;
  }

  return fulfillPurchaseHardened({
    order: freshOrder,
    payment: freshPayment,
    planId: input.planId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
  }).catch(async (error) => {
    const afterOrder = await orderService.getOrder(input.order.id);
    const afterPayment = await paymentService.getPayment(input.payment.id);
    if (afterOrder && afterPayment) {
      const idempotentAfter = await resolveIdempotentResult(
        afterOrder,
        afterPayment,
        input.razorpayPaymentId,
      );
      if (idempotentAfter) {
        return idempotentAfter;
      }
    }
    throw error;
  });
}

export const paymentVerificationService = {
  async verifyMembershipPurchase(
    userId: string,
    input: VerifyPaymentInputValidated,
  ): Promise<VerifyPaymentResult> {
    const order = await orderService.getOrderForUser(input.orderId, userId);
    if (!order) {
      throw new Error('Order not found');
    }

    const plan = await resolvePlanForOrder(order, input.planId);

    const idempotent = await resolveIdempotentResult(order, null, input.razorpayPaymentId);
    if (idempotent) {
      return idempotent;
    }

    const payment = await paymentService.getPaymentByOrderId(order.id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const paymentIdempotent = await resolveIdempotentResult(
      order,
      payment,
      input.razorpayPaymentId,
    );
    if (paymentIdempotent) {
      return paymentIdempotent;
    }

    if (payment.razorpayOrderId !== input.razorpayOrderId) {
      throw new Error('Razorpay order mismatch');
    }

    const signatureValid = razorpaySignatureService.verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );

    if (!signatureValid) {
      await paymentService.updatePayment(payment.id, {
        status: 'FAILED',
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        errorDesc: 'Invalid payment signature',
      });
      throw new Error('INVALID_PAYMENT_SIGNATURE');
    }

    return fulfillPurchase({
      order,
      payment,
      planId: plan.id,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    });
  },

  async processCapturedPayment(
    input: PaymentCapturedInput,
  ): Promise<VerifyPaymentResult> {
    if (input.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    const payment = await findPaymentByRazorpayOrderId(input.razorpayOrderId);
    if (!payment) {
      throw new Error('Payment not found for Razorpay order');
    }

    const order = await orderService.getOrder(payment.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const idempotent = await resolveIdempotentResult(
      order,
      payment,
      input.razorpayPaymentId,
    );
    if (idempotent) {
      return idempotent;
    }

    if (payment.amount !== input.amount || payment.currency !== input.currency) {
      throw new Error('Webhook amount mismatch');
    }
    if (order.amount !== input.amount || order.currency !== input.currency) {
      throw new Error('Webhook amount mismatch');
    }
    if (payment.razorpayOrderId !== input.razorpayOrderId) {
      throw new Error('Razorpay order mismatch');
    }

    const plan = await resolvePlanForOrder(order);

    return fulfillPurchase({
      order,
      payment,
      planId: plan.id,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: null,
    });
  },
};
