import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { categoryService } from '@/features/categories';
import { CategoryCreateSchema } from '@/validations/category.validation';
import type { ApiResponse } from '@/types/api';
import type { CategoryWithCount } from '@/types/category';

export const runtime = 'nodejs';

function authError(error: unknown): NextResponse<ApiResponse<null>> | null {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  if (message === 'UNAUTHENTICATED') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Authentication required' },
      { status: 401 },
    );
  }
  if (message === 'FORBIDDEN' || message === 'USER_NOT_ACTIVE') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Forbidden' },
      { status: 403 },
    );
  }
  return null;
}

export async function GET() {
  try {
    await requireSuperAdmin();
    const items = await categoryService.listCategories();
    const total = await categoryService.countCategories();
    return NextResponse.json<ApiResponse<{ items: CategoryWithCount[]; total: number }>>({
      success: true,
      data: { items, total },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list categories';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = CategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const category = await categoryService.createCategory(parsed.data);
    return NextResponse.json<ApiResponse<{ category: typeof category }>>(
      { success: true, data: { category }, message: 'Category created' },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
