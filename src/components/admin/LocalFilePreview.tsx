'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PreviewKind = 'image' | 'video';

export function LocalFilePreview({
  kind,
  label,
  onPreviewChange,
}: {
  kind: PreviewKind;
  label: string;
  onPreviewChange?: (previewUrl: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFile(file: File | undefined) {
    if (preview) URL.revokeObjectURL(preview);
    if (!file) {
      setPreview(null);
      onPreviewChange?.(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onPreviewChange?.(url);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`local-${kind}-file`}>{label}</Label>
      <Input
        id={`local-${kind}-file`}
        type="file"
        accept={kind === 'image' ? 'image/*' : 'video/*'}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="text-xs text-muted-foreground">
        Local preview only. Files are not uploaded. Enter a URL below to persist.
      </p>
      {preview && (
        <div className="overflow-hidden rounded-md border bg-muted/30 p-2">
          {kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Local preview" className="max-h-40 rounded object-contain" />
          ) : (
            <video src={preview} controls className="max-h-40 w-full rounded" />
          )}
        </div>
      )}
    </div>
  );
}
