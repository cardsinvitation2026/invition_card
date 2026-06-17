'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AuditEvent } from '@/types/audit';

const CATEGORY_VARIANT: Record<
  AuditEvent['category'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  CUSTOMER: 'secondary',
  PAYMENT: 'default',
  MEMBERSHIP: 'outline',
  RENDER: 'secondary',
  DOWNLOAD: 'outline',
  SYSTEM: 'default',
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function AuditEventCard({ event }: { event: AuditEvent }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={CATEGORY_VARIANT[event.category]}>{event.category}</Badge>
          <span className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
        </div>
        <div>
          <p className="font-medium">{event.title}</p>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{event.eventType}</p>
        {Object.keys(event.metadata).length > 0 ? (
          <pre className="overflow-x-auto rounded-md bg-muted/50 p-2 text-xs">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}
