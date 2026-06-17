'use client';

import type { EnvironmentValidationResult } from '@/types/operations';
import { Badge } from '@/components/ui/badge';

export function EnvironmentDiagnosticsCard({
  environment,
}: {
  environment: EnvironmentValidationResult;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {environment.mode}
        </Badge>
        <Badge variant={environment.valid ? 'default' : 'destructive'}>
          {environment.valid ? 'Valid' : 'Missing variables'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Configured</p>
          {environment.configuredVariables.length === 0 ? (
            <p className="text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {environment.configuredVariables.map((name) => (
                <li key={name} className="text-emerald-700">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Missing (production)</p>
          {environment.missingVariables.length === 0 ? (
            <p className="text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {environment.missingVariables.map((name) => (
                <li key={name} className="text-red-700">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
