import { NextResponse } from 'next/server';
import { loadTemplateRuntimeBySlug } from '@/features/runtime-form/template-runtime.loader';
import type { ApiResponse } from '@/types/api';
import type { TemplateField } from '@/types/template-field';

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

  return NextResponse.json<ApiResponse<{ items: TemplateField[] }>>({
    success: true,
    data: { items: loaded.fields },
  });
}
