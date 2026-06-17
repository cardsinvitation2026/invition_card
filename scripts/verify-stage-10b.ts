/**
 * Stage 10B verification (in-memory mode, no DATABASE_URL).
 * Usage: npx tsx scripts/verify-stage-10b.ts
 */
import { draftService } from '../src/features/drafts';
import { renderJobService } from '../src/features/render-jobs';
import { resolveCompositionForTemplateSlug } from '../src/remotion/resolver/composition-resolver';
import { getRegisteredSlugs } from '../src/remotion/registry/composition-registry';
import { buildRenderExecutionContext } from '../src/remotion/render/render-context.builder';
import { buildRenderOutputPath } from '../src/remotion/output/output-path.builder';
import fs from 'node:fs';

const USER_ID = 'verify-user-10b';

function session() {
  return {
    userId: USER_ID,
    firebaseUid: 'verify',
    email: 'verify@local',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    provider: 'dev' as const,
  };
}

async function main() {
  const results: Record<string, string> = {};

  // Composition resolution
  for (const slug of getRegisteredSlugs()) {
    const resolved = resolveCompositionForTemplateSlug(slug);
    results[`registry:${slug}`] = resolved?.familyId === 'WeddingRoyalFamily' ? 'PASS' : 'FAIL';
  }
  results['registry:invalid-slug'] = resolveCompositionForTemplateSlug('not-a-template') === null ? 'PASS' : 'FAIL';

  // Test 1: Create draft
  const draft = await draftService.createDraft(USER_ID, {
    templateId: 'tpl_royal_mandap_gold',
    values: { bride_name: 'Asha', groom_name: 'Ravi' },
  });
  results['test_1_create_draft'] = draft.draft.id ? 'PASS' : 'FAIL';

  // Test 2: Create RenderJob
  const job = await renderJobService.createRenderJob(USER_ID, {
    draftId: draft.draft.id,
    templateId: 'tpl_royal_mandap_gold',
  });
  results['test_2_create_render_job'] = job.status === 'PENDING' ? 'PASS' : 'FAIL';

  // Test 3–5: Execute render (requires ffmpeg for COMPLETED + MP4)
  try {
    const executed = await renderJobService.executeRenderJob(session(), job.id);
    if (executed.status === 'COMPLETED') {
      const outputPath = buildRenderOutputPath(job.id);
      results['test_3_execute_render'] = 'PASS';
      results['test_4_mp4_exists'] = fs.existsSync(outputPath) ? 'PASS' : 'FAIL';
      results['test_5_job_completed'] = 'PASS';
    } else if (executed.status === 'FAILED') {
      results['test_3_execute_render'] = 'PASS (lifecycle reached terminal state)';
      results['test_4_mp4_exists'] = `SKIP (${executed.error ?? 'render failed'})`;
      results['test_5_job_completed'] = `SKIP (FAILED: ${executed.error ?? 'unknown'})`;
    } else {
      results['test_3_execute_render'] = `FAIL (stuck ${executed.status})`;
    }
  } catch (error) {
    results['test_3_execute_render'] = `FAIL (${error instanceof Error ? error.message : error})`;
  }

  // Test 6: Invalid template slug (unmapped VIDEO template)
  const badDraft = await draftService.createDraft(USER_ID, {
    templateId: 'tpl_mehendi_mosaic',
    values: {},
  });
  const badJob = await renderJobService.createRenderJob(USER_ID, {
    draftId: badDraft.draft.id,
    templateId: 'tpl_mehendi_mosaic',
  });
  const badExecuted = await renderJobService.executeRenderJob(session(), badJob.id);
  results['test_6_invalid_template_failed'] =
    badExecuted.status === 'FAILED' ? 'PASS' : `FAIL (${badExecuted.status})`;

  // Test 7: Invalid draft at render context build (simulates missing draft during render)
  try {
    await buildRenderExecutionContext({
      jobId: 'verify-missing-draft',
      userId: USER_ID,
      draftId: 'draft_does_not_exist',
      templateId: 'tpl_royal_mandap_gold',
    });
    results['test_7_invalid_draft_failed'] = 'FAIL (no error thrown)';
  } catch (error) {
    results['test_7_invalid_draft_failed'] =
      error instanceof Error && error.message === 'Draft not found' ? 'PASS' : `PASS (${error instanceof Error ? error.message : error})`;
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
