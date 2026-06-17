import 'server-only';
import { draftService } from '@/features/drafts';
import { downloadLogService } from '@/features/download-logs';
import { membershipService } from '@/features/memberships';
import { orderService } from '@/features/orders';
import { paymentService } from '@/features/payments';
import { renderJobService } from '@/features/render-jobs';
import { userService } from '@/features/users';
import { buildAuditTimeline } from '@/lib/audit/audit-timeline.builder';
import { createAuditEvent } from '@/lib/audit/audit-event.types';
import type { AuditTimeline } from '@/types/audit';
import type { AuthSession } from '@/types/auth';

function customerSession(user: {
  id: string;
  firebaseUid: string;
  email: string;
  role: AuthSession['role'];
  status: AuthSession['status'];
}): AuthSession {
  return {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    role: user.role,
    status: user.status,
    provider: 'dev',
  };
}

export async function buildCustomerAuditTimeline(userId: string): Promise<AuditTimeline | null> {
  const user = await userService.getById(userId);
  if (!user) {
    return null;
  }

  const session = customerSession(user);
  const events = [
    createAuditEvent({
      timestamp: user.createdAt,
      category: 'CUSTOMER',
      eventType: 'USER_CREATED',
      title: 'User account created',
      description: `${user.email} registered in the system.`,
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
        status: user.status,
      },
    }),
  ];

  const [drafts, memberships, orders, downloads, renders] = await Promise.all([
    draftService.listDrafts(userId, { page: 1, pageSize: 200 }),
    membershipService.listMembershipsByUser(userId, { page: 1, pageSize: 200 }),
    orderService.listOrdersByUser(userId, { page: 1, pageSize: 200 }),
    downloadLogService.listByUser(userId, { page: 1, pageSize: 200 }),
    renderJobService.listRenderJobs(session, { page: 1, pageSize: 200 }),
  ]);

  for (const draft of drafts.items) {
    events.push(
      createAuditEvent({
        timestamp: draft.createdAt,
        category: 'CUSTOMER',
        eventType: 'DRAFT_CREATED',
        title: 'Draft created',
        description: `${draft.templateName} draft created.`,
        entityId: draft.id,
        metadata: {
          templateId: draft.templateId,
          templateSlug: draft.templateSlug,
        },
      }),
    );
  }

  for (const job of renders.items) {
    events.push(
      createAuditEvent({
        timestamp: job.createdAt,
        category: 'RENDER',
        eventType: 'RENDER_JOB_CREATED',
        title: 'Render job created',
        description: `Render job ${job.id} queued.`,
        entityId: job.id,
        metadata: {
          draftId: job.draftId,
          templateId: job.templateId,
          status: job.status,
        },
      }),
    );

    if (job.startedAt) {
      events.push(
        createAuditEvent({
          timestamp: job.startedAt,
          category: 'RENDER',
          eventType: 'RENDER_PROCESSING',
          title: 'Render processing started',
          description: `Render job ${job.id} entered PROCESSING.`,
          entityId: job.id,
          metadata: { status: job.status },
        }),
      );
    }

    if (job.status === 'COMPLETED' && job.completedAt) {
      events.push(
        createAuditEvent({
          timestamp: job.completedAt,
          category: 'RENDER',
          eventType: 'RENDER_COMPLETED',
          title: 'Render completed',
          description: `Render job ${job.id} completed successfully.`,
          entityId: job.id,
          metadata: {
            hasFinalUrl: Boolean(job.finalUrl),
          },
        }),
      );
    }

    if (job.status === 'FAILED' && job.completedAt) {
      events.push(
        createAuditEvent({
          timestamp: job.completedAt,
          category: 'RENDER',
          eventType: 'RENDER_FAILED',
          title: 'Render failed',
          description: job.error ?? 'Render job failed.',
          entityId: job.id,
          metadata: { error: job.error },
        }),
      );
    }
  }

  for (const membership of memberships.items) {
    events.push(
      createAuditEvent({
        timestamp: membership.startDate,
        category: 'MEMBERSHIP',
        eventType: 'MEMBERSHIP_CREATED',
        title: 'Membership activated',
        description: `Membership ${membership.id} started.`,
        entityId: membership.id,
        metadata: {
          planId: membership.planId,
          status: membership.status,
          endDate: membership.endDate,
        },
      }),
    );

    if (membership.status === 'EXPIRED') {
      events.push(
        createAuditEvent({
          timestamp: membership.endDate,
          category: 'MEMBERSHIP',
          eventType: 'MEMBERSHIP_EXPIRED',
          title: 'Membership expired',
          description: `Membership ${membership.id} reached end date.`,
          entityId: membership.id,
          metadata: { status: membership.status },
        }),
      );
    }
  }

  for (const order of orders.items) {
    events.push(
      createAuditEvent({
        timestamp: order.createdAt,
        category: 'PAYMENT',
        eventType: 'ORDER_CREATED',
        title: 'Order created',
        description: `Order ${order.id} created (${order.status}).`,
        entityId: order.id,
        metadata: {
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          membershipId: order.membershipId,
        },
      }),
    );

    if (order.status === 'COMPLETED' && order.membershipId) {
      events.push(
        createAuditEvent({
          timestamp: order.updatedAt,
          category: 'PAYMENT',
          eventType: 'ORDER_COMPLETED',
          title: 'Order completed',
          description: `Order ${order.id} linked to membership ${order.membershipId}.`,
          entityId: order.id,
          metadata: {
            membershipId: order.membershipId,
          },
        }),
      );
    }

    const payment = await paymentService.getPaymentByOrderId(order.id);
    if (payment) {
      events.push(
        createAuditEvent({
          timestamp: payment.createdAt,
          category: 'PAYMENT',
          eventType: 'PAYMENT_CREATED',
          title: 'Payment record created',
          description: `Payment ${payment.id} linked to order ${order.id}.`,
          entityId: payment.id,
          metadata: {
            status: payment.status,
            razorpayOrderId: payment.razorpayOrderId,
          },
        }),
      );

      if (payment.status === 'SUCCESS') {
        events.push(
          createAuditEvent({
            timestamp: payment.updatedAt,
            category: 'PAYMENT',
            eventType: 'PAYMENT_SUCCESS',
            title: 'Payment succeeded',
            description: `Payment ${payment.id} marked SUCCESS.`,
            entityId: payment.id,
            metadata: {
              razorpayPaymentId: payment.razorpayPaymentId,
            },
          }),
        );
      }
    }
  }

  for (const download of downloads.items) {
    events.push(
      createAuditEvent({
        timestamp: download.downloadedAt,
        category: 'DOWNLOAD',
        eventType: 'DOWNLOAD_CONSUMED',
        title: 'Download quota consumed',
        description: `Download log ${download.id} recorded.`,
        entityId: download.id,
        metadata: {
          draftId: download.draftId,
          membershipId: download.membershipId,
          hasFileUrl: Boolean(download.fileUrl),
        },
      }),
    );
  }

  return buildAuditTimeline({
    subjectId: userId,
    subjectType: 'customer',
    title: user.name?.trim() ? user.name : user.email,
    description: `Customer lifecycle timeline for ${user.email}`,
    events,
  });
}

export const customerAuditBuilder = {
  buildCustomerAuditTimeline,
};
