import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { templateMusicService } from '@/features/template-music';
import { UpdateMusicSchema, templateMusicIdSchema } from '@/validations/template-music.validation';
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

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = templateMusicIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid music id' },
        { status: 400 },
      );
    }
    const music = await templateMusicService.findById(parsedId.data);
    if (!music) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Template music not found' },
        { status: 404 },
      );
    }
    return NextResponse.json<ApiResponse<{ music: TemplateMusic }>>({
      success: true,
      data: { music },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get template music';
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
    const parsedId = templateMusicIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid music id' },
        { status: 400 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateMusicSchema.safeParse(body);
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
    const music = await templateMusicService.updateMusic(parsedId.data, parsed.data);
    return NextResponse.json<ApiResponse<{ music: TemplateMusic }>>({
      success: true,
      data: { music },
      message: 'Template music updated',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to update template music';
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
    const parsedId = templateMusicIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid music id' },
        { status: 400 },
      );
    }
    const existing = await templateMusicService.findById(parsedId.data);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Template music not found' },
        { status: 404 },
      );
    }
    await templateMusicService.deleteMusic(parsedId.data);
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Template music deleted',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to delete template music';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
