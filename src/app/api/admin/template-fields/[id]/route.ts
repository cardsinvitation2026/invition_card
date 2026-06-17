import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { templateFieldService } from '@/features/template-fields';
import { UpdateFieldSchema, templateFieldIdSchema } from '@/validations/template-field.validation';
import type { ApiResponse } from '@/types/api';
import type { TemplateField } from '@/types/template-field';

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
    const parsedId = templateFieldIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid field id' },
        { status: 400 },
      );
    }
    const field = await templateFieldService.findById(parsedId.data);
    if (!field) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Template field not found' },
        { status: 404 },
      );
    }
    return NextResponse.json<ApiResponse<{ field: TemplateField }>>({
      success: true,
      data: { field },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get template field';
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
    const parsedId = templateFieldIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid field id' },
        { status: 400 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateFieldSchema.safeParse(body);
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
    const field = await templateFieldService.updateField(parsedId.data, parsed.data);
    return NextResponse.json<ApiResponse<{ field: TemplateField }>>({
      success: true,
      data: { field },
      message: 'Template field updated',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to update template field';
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
    const parsedId = templateFieldIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid field id' },
        { status: 400 },
      );
    }
    const existing = await templateFieldService.findById(parsedId.data);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Template field not found' },
        { status: 404 },
      );
    }
    await templateFieldService.deleteField(parsedId.data);
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Template field deleted',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to delete template field';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
