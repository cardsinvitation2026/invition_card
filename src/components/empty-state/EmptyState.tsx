import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Try clearing filters or come back soon.',
  icon,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-3 text-muted-foreground">{icon ?? <SearchX className="size-8" />}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
