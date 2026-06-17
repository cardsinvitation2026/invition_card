import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { categoryService } from '@/features/categories';
import { CategoryUpdateSchema, categoryIdSchema } from '@/validations/category.validation';
import type { ApiResponse } from '@/types/api';
import type { Category } from '@/types/category';

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

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = categoryIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid category id' },
        { status: 400 },
      );
    }
    const category = await categoryService.getCategory(parsedId.data);
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
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get category';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = categoryIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid category id' },
        { status: 400 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const parsed = CategoryUpdateSchema.safeParse(body);
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
    const category = await categoryService.updateCategory(parsedId.data, parsed.data);
    return NextResponse.json<ApiResponse<{ category: Category }>>({
      success: true,
      data: { category },
      message: 'Category updated',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = categoryIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid category id' },
        { status: 400 },
      );
    }
    const existing = await categoryService.getCategory(parsedId.data);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Category not found' },
        { status: 404 },
      );
    }
    await categoryService.deleteCategory(parsedId.data);
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Category deleted',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
