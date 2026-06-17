'use client';

import { Button } from '@/components/ui/button';

export function AdminFormActions({
  submitLabel = 'Save',
  cancelHref,
  loading,
  onCancel,
}: {
  submitLabel?: string;
  cancelHref?: string;
  loading?: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-4">
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </Button>
      {cancelHref ? (
        <Button type="button" variant="outline" asChild disabled={loading}>
          <a href={cancelHref}>Cancel</a>
        </Button>
      ) : onCancel ? (
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
