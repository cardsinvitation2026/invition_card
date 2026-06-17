'use client';

import { AuditEventCard } from '@/components/admin/audit/AuditEventCard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import type { AuditTimeline } from '@/types/audit';

export function AuditTimelineView({ timeline }: { timeline: AuditTimeline }) {
  if (timeline.events.length === 0) {
    return (
      <AdminEmptyState
        title="No audit events"
        description="No persisted records were found for this investigation subject."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <div className="relative space-y-4 border-l border-border pl-6">
          {timeline.events.map((event) => (
            <div key={event.id} className="relative">
              <span className="absolute -left-[1.9rem] top-4 size-3 rounded-full bg-primary" />
              <AuditEventCard event={event} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:hidden">
        {timeline.events.map((event) => (
          <AuditEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
