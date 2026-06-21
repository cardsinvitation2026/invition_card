'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createRenderJob, RenderJobApiError } from '@/lib/render-jobs/api';
import { isRegistryMappedSlug } from '@/remotion/registry/composition-registry';
import type { TemplateType } from '@/types/template';

interface GenerateVideoButtonProps {
  draftId: string | null;
  templateId: string;
  templateSlug: string;
  templateType: TemplateType;
}

export function GenerateVideoButton({
  draftId,
  templateId,
  templateSlug,
  templateType,
}: GenerateVideoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (templateType !== 'VIDEO') {
    return null;
  }

  const isMapped = isRegistryMappedSlug(templateSlug);
  const canGenerate = Boolean(draftId) && isMapped && !loading;

  async function handleGenerate() {
    if (!draftId) {
      toast.error('Please save your draft before generating video.');
      return;
    }

    if (!isMapped) {
      toast.error('This template is not ready for video render yet.');
      return;
    }

    setLoading(true);
    try {
      await createRenderJob({ draftId, templateId });
      toast.success('Video render started. You can track progress in Render History.');
      router.push('/account/renders');
    } catch (error) {
      if (error instanceof RenderJobApiError) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to start video render');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        disabled={!canGenerate}
        onClick={() => void handleGenerate()}
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Clapperboard className="mr-2 size-4" />
        )}
        Generate video
      </Button>
      {!draftId ? (
        <p className="text-xs text-muted-foreground">
          Saving your draft… Generate video will be available once the draft is saved.
        </p>
      ) : null}
      {draftId && !isMapped ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This template is not ready for cloud video render yet.
        </p>
      ) : null}
    </div>
  );
}
