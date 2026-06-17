'use client';

import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import type { AutosaveStatus } from '@/features/drafts/autosave/useDraftAutosave';

export function DraftSaveStatus({
  status,
  restoring,
}: {
  status: AutosaveStatus;
  restoring?: boolean;
}) {
  if (restoring) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Restoring draft…
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Saving…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="size-3.5" />
        Saved
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <CloudOff className="size-3.5" />
        Save failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Cloud className="size-3.5" />
      Autosave on
    </span>
  );
}
