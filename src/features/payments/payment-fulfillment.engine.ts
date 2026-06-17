import 'server-only';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { getPrisma } from '@/lib/prisma/client';
import { membershipService } from '@/features/memberships';
import {
  prismaCompleteOrderIfPending,
  prismaLockOrderRow,
} from '@/features/orders/prisma-order.repository';
import {
  prismaMarkPaymentSuccessIfPending,
} from '@/features/payments/prisma-payment.repository';
import type { Order } from '@/types/order';
import type { Payment, VerifyPaymentResult } from '@/types/payment';

const orderFulfillmentLocks = new Map<string, Promise<void>>();

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

async function withOrderFulfillmentLock<T>(
  orderId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = orderFulfillmentLocks.get(orderId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chain = previous.then(() => gate);
  orderFulfillmentLocks.set(orderId, chain);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (orderFulfillmentLocks.get(orderId) === chain) {
      orderFulfillmentLocks.delete(orderId);
    }
  }
}

function readInMemoryOrder(orderId: string): Order | null {
  const store = globalThis.__mi_inmem_orders__ as Map<string, Order> | undefined;
  return store?.get(orderId) ?? null;
}

function readInMemoryPayment(paymentId: string): Payment | null {
  const store = globalThis.__mi_inmem_payments__ as Map<string, Payment> | undefined;
  return store?.get(paymentId) ?? null;
}

function tryMarkInMemoryPaymentSuccess(
  paymentId: string,
  razorpayPaymentId: string,
  razorpaySignature: string | null,
): boolean {
  const store = globalThis.__mi_inmem_payments__ as Map<string, Payment> | undefined;
  if (!store) {
    return false;
  }
  const existing = store.get(paymentId);
  if (!existing || existing.status !== 'PENDING') {
    return false;
  }
  store.set(paymentId, {
    ...existing,
    status: 'SUCCESS',
    razorpayPaymentId,
    razorpaySignature,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

function tryCompleteInMemoryOrderIfPending(orderId: string, membershipId: string): boolean {
  const store = globalThis.__mi_inmem_orders__ as Map<string, Order> | undefined;
  if (!store) {
    return false;
  }
  const existing = store.get(orderId);
  if (!existing || existing.status !== 'PENDING' || existing.membershipId) {
    return false;
  }
  store.set(orderId, {
    ...existing,
    status: 'COMPLETED',
    membershipId,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

async function fulfillPrismaPurchase(input: {
  orderId: string;
  planId: string;
  paymentId: string;
  userId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
}): Promise<VerifyPaymentResult> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error('Prisma unavailable');
  }

  return prisma.$transaction(async (tx) => {
    const lockedOrder = await prismaLockOrderRow(tx, input.orderId);
    if (!lockedOrder) {
      throw new Error('Order not found');
    }

    if (lockedOrder.status === 'COMPLETED' || lockedOrder.membershipId) {
      return completedResult(
        lockedOrder.id,
        lockedOrder.membershipId ?? '',
        input.paymentId,
      );
    }

    const paymentClaimed = await prismaMarkPaymentSuccessIfPending(tx, input.paymentId, {
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    });

    if (!paymentClaimed) {
      const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
      if (payment?.status !== 'SUCCESS') {
        throw new Error('Payment fulfillment claim failed');
      }
    }

    const membership = await membershipService.createMembershipInTransaction(tx, {
      userId: input.userId,
      planId: input.planId,
    });

    const orderCompleted = await prismaCompleteOrderIfPending(
      tx,
      input.orderId,
      membership.id,
    );
    if (!orderCompleted) {
      throw new Error('Order fulfillment claim failed');
    }

    return {
      orderId: input.orderId,
      membershipId: membership.id,
      paymentId: input.paymentId,
      alreadyCompleted: false,
    };
  });
}

async function fulfillInMemoryPurchase(input: {
  orderId: string;
  planId: string;
  paymentId: string;
  userId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
}): Promise<VerifyPaymentResult> {
  return withOrderFulfillmentLock(input.orderId, async () => {
    const order = readInMemoryOrder(input.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'COMPLETED' || order.membershipId) {
      return completedResult(order.id, order.membershipId ?? '', input.paymentId);
    }

    const paymentClaimed = tryMarkInMemoryPaymentSuccess(
      input.paymentId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );
    if (!paymentClaimed) {
      const payment = readInMemoryPayment(input.paymentId);
      if (payment?.status !== 'SUCCESS') {
        throw new Error('Payment fulfillment claim failed');
      }
    }

    let membershipId: string | null = null;
    try {
      const membership = await membershipService.createMembership({
        userId: input.userId,
        planId: input.planId,
      });
      membershipId = membership.id;

      const orderCompleted = tryCompleteInMemoryOrderIfPending(input.orderId, membership.id);
      if (!orderCompleted) {
        throw new Error('Order fulfillment claim failed');
      }

      return {
        orderId: input.orderId,
        membershipId: membership.id,
        paymentId: input.paymentId,
        alreadyCompleted: false,
      };
    } catch (error) {
      if (membershipId) {
        await membershipService.cancelMembership(membershipId);
      }
      const payment = readInMemoryPayment(input.paymentId);
      if (payment?.status === 'SUCCESS' && payment.id === input.paymentId) {
        const store = globalThis.__mi_inmem_payments__ as Map<string, Payment> | undefined;
        store?.set(input.paymentId, {
          ...payment,
          status: 'PENDING',
          updatedAt: new Date().toISOString(),
        });
      }
      throw error;
    }
  });
}

export async function fulfillPurchaseHardened(input: {
  order: Order;
  payment: Payment;
  planId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
}): Promise<VerifyPaymentResult> {
  const fulfillmentInput = {
    orderId: input.order.id,
    planId: input.planId,
    paymentId: input.payment.id,
    userId: input.order.userId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
  };

  if (hasDatabaseUrl()) {
    return fulfillPrismaPurchase(fulfillmentInput);
  }

  return fulfillInMemoryPurchase(fulfillmentInput);
}

export const paymentFulfillmentEngine = {
  fulfillPurchaseHardened,
};
