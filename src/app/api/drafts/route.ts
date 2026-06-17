import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { draftService } from '@/features/drafts';
import { draftCreateSchema, draftListQuerySchema } from '@/validations/draft.validation';
import type { ApiResponse } from '@/types/api';
import type { DraftDetailResponse, DraftListResult } from '@/types/draft';

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

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = draftListQuerySchema.safeParse(raw);
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

    const result = await draftService.listDrafts(session.userId, parsed.data);
    return NextResponse.json<ApiResponse<DraftListResult>>({
      success: true,
      data: result,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list drafts';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const parsed = draftCreateSchema.safeParse(body);
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

    const draft = await draftService.createDraft(session.userId, parsed.data);
    return NextResponse.json<ApiResponse<DraftDetailResponse>>(
      { success: true, data: draft, message: 'Draft created' },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create draft';
    if (message === 'DRAFT_LIMIT_REACHED') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'You have reached the maximum of 50 drafts. Delete a draft to create a new one.',
        },
        { status: 400 },
      );
    }
    if (message === 'Template not found') {
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
