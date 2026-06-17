import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { templateMusicService } from '@/features/template-music';
import { CreateMusicSchema } from '@/validations/template-music.validation';
import type { ApiResponse } from '@/types/api';
import type { TemplateMusic } from '@/types/template-music';

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
    const items = await templateMusicService.list();
    const total = await templateMusicService.count();
    const defaultMusic = await templateMusicService.findDefault();
    return NextResponse.json<
      ApiResponse<{ items: TemplateMusic[]; total: number; defaultMusic: TemplateMusic | null }>
    >({
      success: true,
      data: { items, total, defaultMusic },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list template music';
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
    const parsed = CreateMusicSchema.safeParse(body);
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
    const music = await templateMusicService.createMusic(parsed.data);
    return NextResponse.json<ApiResponse<{ music: TemplateMusic }>>(
      { success: true, data: { music }, message: 'Template music created' },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create template music';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
