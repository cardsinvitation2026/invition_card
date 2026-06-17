import type { ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state/EmptyState';

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return <EmptyState title={title} description={description} action={action} />;
}
