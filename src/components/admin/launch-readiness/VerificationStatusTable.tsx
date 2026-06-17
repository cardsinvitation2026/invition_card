'use client';

import { Badge } from '@/components/ui/badge';
import type { VerificationSuiteItem } from '@/types/launch-readiness';

export function VerificationStatusTable({ suites }: { suites: VerificationSuiteItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Suite</th>
            <th className="px-4 py-3 font-medium">Script</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {suites.map((suite) => (
            <tr key={suite.script} className="border-b last:border-b-0">
              <td className="px-4 py-3">{suite.label}</td>
              <td className="px-4 py-3 font-mono text-xs">{suite.script}</td>
              <td className="px-4 py-3">
                <SuiteBadge suite={suite} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        Run verification suites in CI or locally before launch. API reports script presence only.
      </p>
    </div>
  );
}

function SuiteBadge({ suite }: { suite: VerificationSuiteItem }) {
  if (!suite.scriptPresent) {
    return <Badge variant="destructive">FAIL</Badge>;
  }
  if (suite.status === 'UNKNOWN') {
    return <Badge variant="outline">UNKNOWN</Badge>;
  }
  return <Badge variant="secondary">{suite.status}</Badge>;
}
