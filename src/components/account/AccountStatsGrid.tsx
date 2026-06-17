import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AccountStatsGridProps {
  children: ReactNode;
  className?: string;
}

export function AccountStatsGrid({ children, className }: AccountStatsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
