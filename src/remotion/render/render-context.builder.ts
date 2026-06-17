import 'server-only';
import { draftService } from '@/features/drafts';
import { templateService } from '@/features/templates';
import { templateMusicService } from '@/features/template-music';
import type { FamilyInputProps } from '@/remotion/types/family-input-props';
import type { RenderExecutionContext } from '@/types/render-execution';
import { resolveCompositionForTemplateSlug } from '@/remotion/resolver/composition-resolver';

export async function buildRenderExecutionContext(input: {
  jobId: string;
  userId: string;
  draftId: string;
  templateId: string;
}): Promise<RenderExecutionContext> {
  const draft = await draftService.getDraft(input.userId, input.draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  if (draft.draft.templateId !== input.templateId) {
    throw new Error('Draft template mismatch');
  }

  const template = await templateService.getTemplate(input.templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  if (template.type !== 'VIDEO') {
    throw new Error('Template type does not support video rendering');
  }

  const resolved = resolveCompositionForTemplateSlug(template.slug);
  if (!resolved) {
    throw new Error('Composition not found for template slug');
  }

  let musicUrl: string | null = null;
  if (template.musicId) {
    const music = await templateMusicService.findById(template.musicId);
    musicUrl = music?.url ?? null;
  }

  const inputProps: FamilyInputProps = {
    template,
    values: draft.values,
    musicUrl,
  };

  const { meta } = resolved.entry;

  return {
    jobId: input.jobId,
    compositionId: meta.id,
    inputProps,
    fps: meta.fps,
    width: meta.width,
    height: meta.height,
    durationInFrames: meta.durationInFrames,
  };
}
