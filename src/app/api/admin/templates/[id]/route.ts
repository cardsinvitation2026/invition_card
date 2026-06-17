import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { templateService } from '@/features/templates';
import { TemplateUpdateSchema, templateIdSchema } from '@/validations/template.validation';
import type { ApiResponse } from '@/types/api';
import type { TemplateDetail } from '@/types/template';

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
    const parsedId = templateIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid template id' },
        { status: 400 },
      );
    }
    const template = await templateService.getTemplate(parsedId.data);
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
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get template';
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
    const parsedId = templateIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid template id' },
        { status: 400 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const parsed = TemplateUpdateSchema.safeParse(body);
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
    const template = await templateService.updateTemplate(parsedId.data, parsed.data);
    return NextResponse.json<ApiResponse<{ template: TemplateDetail }>>({
      success: true,
      data: { template },
      message: 'Template updated',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to update template';
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
    const parsedId = templateIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid template id' },
        { status: 400 },
      );
    }
    const existing = await templateService.getTemplate(parsedId.data);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Template not found' },
        { status: 404 },
      );
    }
    await templateService.deleteTemplate(parsedId.data);
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Template deleted',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to delete template';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
