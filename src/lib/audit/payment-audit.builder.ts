import 'server-only';
import { membershipService } from '@/features/memberships';
import { orderService } from '@/features/orders';
import { paymentService } from '@/features/payments';
import { buildAuditTimeline } from '@/lib/audit/audit-timeline.builder';
import { createAuditEvent } from '@/lib/audit/audit-event.types';
import type { AuditTimeline } from '@/types/audit';

export async function buildPaymentAuditTimeline(paymentId: string): Promise<AuditTimeline | null> {
  const payment = await paymentService.getPayment(paymentId);
  if (!payment) {
    return null;
  }

  const order = await orderService.getOrder(payment.orderId);
  const events = [
    createAuditEvent({
      timestamp: payment.createdAt,
      category: 'PAYMENT',
      eventType: 'PAYMENT_CREATED',
      title: 'Payment created',
      description: `Payment ${payment.id} created for order ${payment.orderId}.`,
      entityId: payment.id,
      metadata: {
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      },
    }),
  ];

  if (order) {
    events.push(
      createAuditEvent({
        timestamp: order.createdAt,
        category: 'PAYMENT',
        eventType: 'ORDER_CREATED',
        title: 'Order created',
        description: `Order ${order.id} created for user ${order.userId}.`,
        entityId: order.id,
        metadata: {
          userId: order.userId,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
        },
      }),
    );
  }

  if (payment.razorpayOrderId) {
    events.push(
      createAuditEvent({
        timestamp: payment.updatedAt,
        category: 'PAYMENT',
        eventType: 'RAZORPAY_ORDER_LINKED',
        title: 'Razorpay order linked',
        description: `Razorpay order ${payment.razorpayOrderId} linked to payment.`,
        entityId: payment.id,
        metadata: { razorpayOrderId: payment.razorpayOrderId },
      }),
    );
  }

  if (payment.status === 'SUCCESS') {
    events.push(
      createAuditEvent({
        timestamp: payment.updatedAt,
        category: 'PAYMENT',
        eventType: 'PAYMENT_VERIFIED',
        title: 'Payment verified',
        description: 'Payment marked SUCCESS after verification or webhook fulfillment.',
        entityId: payment.id,
        metadata: {
          razorpayPaymentId: payment.razorpayPaymentId,
          signaturePresent: Boolean(payment.razorpaySignature),
        },
      }),
    );
  }

  if (order?.membershipId) {
    const membership = await membershipService.getMembership(order.membershipId);
    events.push(
      createAuditEvent({
        timestamp: order.updatedAt,
        category: 'MEMBERSHIP',
        eventType: 'MEMBERSHIP_LINKED',
        title: 'Membership created from order',
        description: `Order ${order.id} fulfilled with membership ${order.membershipId}.`,
        entityId: order.membershipId,
        metadata: {
          orderId: order.id,
          planId: membership?.planId ?? null,
          orderStatus: order.status,
        },
      }),
    );
  }

  if (order?.status === 'COMPLETED') {
    events.push(
      createAuditEvent({
        timestamp: order.updatedAt,
        category: 'PAYMENT',
        eventType: 'ORDER_COMPLETED',
        title: 'Order completed',
        description: 'Order reached COMPLETED state.',
        entityId: order.id,
        metadata: {
          membershipId: order.membershipId,
          fulfillmentEvidence:
            payment.status === 'SUCCESS' && order.membershipId
              ? 'payment_success_with_membership'
              : 'incomplete',
        },
      }),
    );
  }

  return buildAuditTimeline({
    subjectId: paymentId,
    subjectType: 'payment',
    title: `Payment ${payment.id}`,
    description: order ? `Order ${order.id} · ${payment.status}` : payment.status,
    events,
  });
}

export const paymentAuditBuilder = {
  buildPaymentAuditTimeline,
};
