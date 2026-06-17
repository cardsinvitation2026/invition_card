import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { templateFieldService } from '@/features/template-fields';
import {
  CreateFieldSchema,
  reorderFieldsSchema,
} from '@/validations/template-field.validation';
import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type { TemplateField } from '@/types/template-field';

export const runtime = 'nodejs';

const templateIdQuerySchema = z.string().trim().min(1).max(64);

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

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const templateId = req.nextUrl.searchParams.get('templateId');
    const parsed = templateIdQuerySchema.safeParse(templateId);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'templateId query parameter is required' },
        { status: 400 },
      );
    }
    const items = await templateFieldService.findByTemplate(parsed.data);
    return NextResponse.json<ApiResponse<{ items: TemplateField[] }>>({
      success: true,
      data: { items },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list template fields';
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
    const parsed = CreateFieldSchema.safeParse(body);
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
    const field = await templateFieldService.createField(parsed.data);
    return NextResponse.json<ApiResponse<{ field: TemplateField }>>(
      { success: true, data: { field }, message: 'Template field created' },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create template field';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = reorderFieldsSchema.safeParse(body);
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
    const items = await templateFieldService.reorderFields(parsed.data);
    return NextResponse.json<ApiResponse<{ items: TemplateField[] }>>({
      success: true,
      data: { items },
      message: 'Template fields reordered',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to reorder template fields';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
