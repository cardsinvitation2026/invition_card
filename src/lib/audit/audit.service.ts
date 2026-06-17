import 'server-only';
import { buildCustomerAuditTimeline } from '@/lib/audit/customer-audit.builder';
import { buildDownloadAuditTimeline } from '@/lib/audit/download-audit.builder';
import { buildMembershipAuditTimeline } from '@/lib/audit/membership-audit.builder';
import { buildPaymentAuditTimeline } from '@/lib/audit/payment-audit.builder';
import { buildRenderAuditTimeline } from '@/lib/audit/render-audit.builder';
import { getSystemObservabilitySnapshot } from '@/lib/audit/system-observability.service';
import type { AuditOverviewSnapshot, AuditTimeline } from '@/types/audit';

export const auditService = {
  async getOverview(): Promise<AuditOverviewSnapshot> {
    const observability = await getSystemObservabilitySnapshot();
    return {
      observability,
      generatedAt: new Date().toISOString(),
    };
  },

  getCustomerTimeline(userId: string): Promise<AuditTimeline | null> {
    return buildCustomerAuditTimeline(userId);
  },

  getRenderTimeline(renderJobId: string): Promise<AuditTimeline | null> {
    return buildRenderAuditTimeline(renderJobId);
  },

  getPaymentTimeline(paymentId: string): Promise<AuditTimeline | null> {
    return buildPaymentAuditTimeline(paymentId);
  },

  getMembershipTimeline(membershipId: string): Promise<AuditTimeline | null> {
    return buildMembershipAuditTimeline(membershipId);
  },

  getDownloadTimeline(downloadLogId: string): Promise<AuditTimeline | null> {
    return buildDownloadAuditTimeline(downloadLogId);
  },
};
