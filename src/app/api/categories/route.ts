import { NextResponse } from 'next/server';
import { categoryService } from '@/features/categories';
import type { ApiResponse } from '@/types/api';
import type { CategoryWithCount } from '@/types/category';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET() {
  const items = await categoryService.listActive();
  return NextResponse.json<ApiResponse<{ items: CategoryWithCount[] }>>({
    success: true,
    data: { items },
  });
}
