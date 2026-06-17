import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { templateService } from '@/features/templates';
import { TemplateCreateSchema, templateAdminListQuerySchema } from '@/validations/template.validation';
import type { ApiResponse } from '@/types/api';
import type { TemplateListResult } from '@/types/template';

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

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = templateAdminListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'Invalid query parameters',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const result = await templateService.listTemplatesAdmin(parsed.data);
    const total = await templateService.countTemplates({
      search: parsed.data.search,
      categorySlug: parsed.data.categorySlug,
      language: parsed.data.language,
      featured: parsed.data.featured,
      status: parsed.data.status,
      visibility: parsed.data.visibility,
    });
    return NextResponse.json<ApiResponse<TemplateListResult & { totalCount: number }>>({
      success: true,
      data: { ...result, totalCount: total },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list templates';
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
    const parsed = TemplateCreateSchema.safeParse(body);
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
    const template = await templateService.createTemplate(parsed.data);
    return NextResponse.json<ApiResponse<{ template: typeof template }>>(
      { success: true, data: { template }, message: 'Template created' },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create template';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
