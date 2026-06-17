import { NextResponse } from 'next/server';
import { buildFormDefinitionResponse } from '@/features/runtime-form/form-definition.builder';
import { loadTemplateRuntimeBySlug } from '@/features/runtime-form/template-runtime.loader';
import type { ApiResponse } from '@/types/api';
import type { RuntimeFormDefinitionResponse } from '@/types/form-runtime';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const loaded = await loadTemplateRuntimeBySlug(slug);

  if (!loaded.ok) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: loaded.message },
      { status: loaded.status },
    );
  }

  const data = buildFormDefinitionResponse(loaded.template, loaded.fields);

  return NextResponse.json<ApiResponse<RuntimeFormDefinitionResponse>>({
    success: true,
    data,
  });
}
