import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { draftService } from '@/features/drafts';
import { draftIdSchema, draftUpdateSchema } from '@/validations/draft.validation';
import type { ApiResponse } from '@/types/api';
import type { DraftDetailResponse } from '@/types/draft';

export const runtime = 'nodejs';

function authError(error: unknown): NextResponse<ApiResponse<null>> | null {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  if (message === 'UNAUTHENTICATED') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Authentication required' },
      { status: 401 },
    );
  }
  if (message === 'USER_NOT_ACTIVE') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Account is not active' },
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
    const session = await requireSession();
    const { id } = await ctx.params;
    const parsedId = draftIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid draft id' },
        { status: 400 },
      );
    }

    const draft = await draftService.getDraft(session.userId, parsedId.data);
    if (!draft) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Draft not found' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<DraftDetailResponse>>({
      success: true,
      data: draft,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get draft';
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
    const session = await requireSession();
    const { id } = await ctx.params;
    const parsedId = draftIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid draft id' },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = draftUpdateSchema.safeParse(body);
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

    const draft = await draftService.updateDraft(session.userId, parsedId.data, parsed.data);
    return NextResponse.json<ApiResponse<DraftDetailResponse>>({
      success: true,
      data: draft,
      message: 'Draft updated',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to update draft';
    if (message === 'Draft not found') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message },
        { status: 404 },
      );
    }
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
    const session = await requireSession();
    const { id } = await ctx.params;
    const parsedId = draftIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid draft id' },
        { status: 400 },
      );
    }

    await draftService.deleteDraft(session.userId, parsedId.data);
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Draft deleted',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to delete draft';
    if (message === 'Draft not found') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message },
        { status: 404 },
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
