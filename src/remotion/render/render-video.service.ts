import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { renderExecutionInputSchema } from '@/validations/render-execution.validation';
import { buildRenderExecutionContext } from '@/remotion/render/render-context.builder';
import { buildRenderOutputPath } from '@/remotion/output/output-path.builder';
import type { RenderVideoResult } from '@/remotion/render/render-result';

const REMOTION_ENTRY = path.join(process.cwd(), 'src', 'remotion', 'render', 'remotion-entry.tsx');

let cachedBundleLocation: string | null = null;

async function getBundleLocation(): Promise<string> {
  if (cachedBundleLocation) {
    return cachedBundleLocation;
  }
  cachedBundleLocation = await bundle({
    entryPoint: REMOTION_ENTRY,
    webpackOverride: (config) => {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        '@': path.join(process.cwd(), 'src'),
      };
      return config;
    },
  });
  return cachedBundleLocation;
}

function computeDurationMs(durationInFrames: number, fps: number): number {
  return Math.round((durationInFrames / fps) * 1000);
}

export const renderVideoService = {
  async execute(input: {
    jobId: string;
    userId: string;
    draftId: string;
    templateId: string;
  }): Promise<RenderVideoResult> {
    const parsed = renderExecutionInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error('Invalid render execution input');
    }

    const context = await buildRenderExecutionContext(parsed.data);
    const outputPath = buildRenderOutputPath(context.jobId);
    const serveUrl = await getBundleLocation();

    const composition = await selectComposition({
      serveUrl,
      id: context.compositionId,
      inputProps: context.inputProps as unknown as Record<string, unknown>,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: context.inputProps as unknown as Record<string, unknown>,
    });

    const renderedAt = new Date().toISOString();

    return {
      outputPath,
      durationMs: computeDurationMs(context.durationInFrames, context.fps),
      renderedAt,
    };
  },
};
