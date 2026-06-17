import 'server-only';
import { membershipPlanService } from '@/features/membership-plans';
import { membershipService } from '@/features/memberships';
import { orderService } from '@/features/orders';
import { paymentService } from '@/features/payments';
import { buildAuditTimeline } from '@/lib/audit/audit-timeline.builder';
import { createAuditEvent } from '@/lib/audit/audit-event.types';
import type { AuditTimeline } from '@/types/audit';

export async function buildMembershipAuditTimeline(
  membershipId: string,
): Promise<AuditTimeline | null> {
  const membership = await membershipService.getMembership(membershipId);
  if (!membership) {
    return null;
  }

  const [plan, order, remainingDownloads] = await Promise.all([
    membershipPlanService.getPlan(membership.planId),
    orderService.findOrderByMembershipId(membershipId),
    membershipService.calculateRemainingDownloads(membership.userId),
  ]);

  const events = [
    createAuditEvent({
      timestamp: membership.startDate,
      category: 'MEMBERSHIP',
      eventType: 'MEMBERSHIP_CREATED',
      title: 'Membership created',
      description: `Membership ${membership.id} activated for user ${membership.userId}.`,
      entityId: membership.id,
      metadata: {
        userId: membership.userId,
        planId: membership.planId,
        planName: plan?.name ?? null,
        status: membership.status,
        endDate: membership.endDate,
      },
    }),
  ];

  if (membership.status === 'EXPIRED' || membership.status === 'CANCELLED') {
    events.push(
      createAuditEvent({
        timestamp: membership.endDate,
        category: 'MEMBERSHIP',
        eventType: 'MEMBERSHIP_ENDED',
        title: `Membership ${membership.status.toLowerCase()}`,
        description: `Membership ended with status ${membership.status}.`,
        entityId: membership.id,
        metadata: { status: membership.status },
      }),
    );
  }

  events.push(
    createAuditEvent({
      timestamp: membership.updatedAt,
      category: 'MEMBERSHIP',
      eventType: 'MEMBERSHIP_QUOTA_SNAPSHOT',
      title: 'Quota snapshot',
      description: `${membership.downloadsUsed} download(s) used on this membership.`,
      entityId: membership.id,
      metadata: {
        downloadsUsed: membership.downloadsUsed,
        downloadLimit: plan?.downloadLimit ?? null,
        remainingDownloads: remainingDownloads.remainingDownloads,
        unlimited: remainingDownloads.unlimited,
      },
    }),
  );

  if (order) {
    events.push(
      createAuditEvent({
        timestamp: order.createdAt,
        category: 'PAYMENT',
        eventType: 'ASSOCIATED_ORDER',
        title: 'Associated order',
        description: `Membership linked to order ${order.id}.`,
        entityId: order.id,
        metadata: {
          orderStatus: order.status,
          amount: order.amount,
          currency: order.currency,
        },
      }),
    );

    const payment = await paymentService.getPaymentByOrderId(order.id);
    if (payment) {
      events.push(
        createAuditEvent({
          timestamp: payment.updatedAt,
          category: 'PAYMENT',
          eventType: 'ASSOCIATED_PAYMENT',
          title: 'Associated payment',
          description: `Order fulfilled via payment ${payment.id} (${payment.status}).`,
          entityId: payment.id,
          metadata: {
            paymentStatus: payment.status,
            razorpayPaymentId: payment.razorpayPaymentId,
          },
        }),
      );
    }
  }

  return buildAuditTimeline({
    subjectId: membershipId,
    subjectType: 'membership',
    title: plan?.name ? `${plan.name} membership` : `Membership ${membership.id}`,
    description: `Status: ${membership.status}`,
    events,
  });
}

export const membershipAuditBuilder = {
  buildMembershipAuditTimeline,
};
