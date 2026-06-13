import { NextResponse } from 'next/server';
import { categoryService } from '@/features/categories';
import { categorySlugSchema } from '@/validations/category';
import type { ApiResponse } from '@/types/api';
import type { Category } from '@/types/category';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const parsed = categorySlugSchema.safeParse(slug);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Invalid slug' },
      { status: 400 },
    );
  }
  const category = await categoryService.getBySlug(parsed.data);
  if (!category) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Category not found' },
      { status: 404 },
    );
  }
  return NextResponse.json<ApiResponse<{ category: Category }>>({
    success: true,
    data: { category },
  });
}
