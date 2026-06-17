'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FileQuestion } from 'lucide-react';

export function RuntimeTemplateLoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export function RuntimeFormLoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export function RuntimeFieldsLoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-md" />
      ))}
    </div>
  );
}

export function RuntimeFormErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load form"
      description={message}
      onRetry={onRetry}
    />
  );
}

export function RuntimeFormEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
      <FileQuestion className="mb-3 size-10 text-muted-foreground" />
      <h3 className="font-semibold">No fields configured</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        This template has no dynamic fields yet. An admin must configure template fields before
        personalisation is available.
      </p>
    </div>
  );
}
