import type { AuditEvent, AuditEventCategory } from '@/types/audit';

export type { AuditEvent, AuditEventCategory };

export interface CreateAuditEventInput {
  id?: string;
  timestamp: string;
  category: AuditEventCategory;
  eventType: string;
  title: string;
  description: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  return {
    id:
      input.id ??
      `${input.category}-${input.eventType}-${input.entityId}-${input.timestamp}`,
    timestamp: input.timestamp,
    category: input.category,
    eventType: input.eventType,
    title: input.title,
    description: input.description,
    entityId: input.entityId,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
  };
}

export function sortAuditEvents(events: AuditEvent[]): AuditEvent[] {
  return [...events].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}
