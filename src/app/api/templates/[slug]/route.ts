import { NextResponse } from 'next/server';
import { templateService } from '@/features/templates';
import { templateSlugSchema } from '@/validations/template';
import type { ApiResponse } from '@/types/api';
import type { TemplateDetail } from '@/types/template';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const parsed = templateSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Invalid slug' },
      { status: 400 },
    );
  }
  const template = await templateService.getBySlug(parsed.data);
  if (!template) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Template not found' },
      { status: 404 },
    );
  }
  return NextResponse.json<ApiResponse<{ template: TemplateDetail }>>({
    success: true,
    data: { template },
  });
}
