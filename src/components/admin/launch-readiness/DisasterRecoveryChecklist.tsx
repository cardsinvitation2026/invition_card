'use client';

import type { DisasterRecoverySnapshot } from '@/types/launch-readiness';

export function DisasterRecoveryChecklist({ snapshot }: { snapshot: DisasterRecoverySnapshot }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {snapshot.items.map((item) => (
        <div key={item.id} className="space-y-3 rounded-lg border p-4">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">Owner: {item.ownership}</p>
          </div>
          <p className="text-sm text-muted-foreground">{item.procedure}</p>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Verification
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {item.verificationSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
