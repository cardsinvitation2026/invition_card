import type { AuditEvent, AuditTimeline } from '@/types/audit';
import { sortAuditEvents } from '@/lib/audit/audit-event.types';

export function buildAuditTimeline(input: {
  subjectId: string;
  subjectType: string;
  title: string;
  description?: string | null;
  events: AuditEvent[];
}): AuditTimeline {
  return {
    subjectId: input.subjectId,
    subjectType: input.subjectType,
    title: input.title,
    description: input.description ?? null,
    events: sortAuditEvents(input.events),
    generatedAt: new Date().toISOString(),
  };
}
