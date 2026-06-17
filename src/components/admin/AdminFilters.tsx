import type { ReactNode } from 'react';

export function AdminFilters({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
  );
}
