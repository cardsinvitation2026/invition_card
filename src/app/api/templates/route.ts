import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/features/templates';
import { templateListQuerySchema } from '@/validations/template';
import type { ApiResponse } from '@/types/api';
import type { TemplateListResult } from '@/types/template';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = templateListQuerySchema.safeParse(raw);
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
  const result = await templateService.list(parsed.data);
  return NextResponse.json<ApiResponse<TemplateListResult>>({
    success: true,
    data: result,
  });
}
