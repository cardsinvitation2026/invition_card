import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { videoAccessService, VideoAccessError } from '@/features/video-access';
import { videoAccessRenderJobIdSchema } from '@/validations/video-access.validation';
import type { ApiResponse } from '@/types/api';
import type { SignedVideoAccess } from '@/types/video-access';

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

function accessError(error: VideoAccessError): NextResponse<ApiResponse<null>> {
  const statusByCode: Record<string, number> = {
    VIDEO_NOT_FOUND: 404,
    VIDEO_NOT_AVAILABLE: 400,
    VIDEO_URL_MISSING: 400,
    FORBIDDEN: 403,
  };

  const messageByCode: Record<string, string> = {
    VIDEO_NOT_FOUND: 'Video not found',
    VIDEO_NOT_AVAILABLE: 'Video is not available',
    VIDEO_URL_MISSING: 'Video URL is missing',
    FORBIDDEN: 'Forbidden',
  };

  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      data: null,
      message: messageByCode[error.code] ?? error.message,
    },
    { status: statusByCode[error.code] ?? 400 },
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ renderJobId: string }> },
) {
  try {
    const session = await requireSession();
    const { renderJobId } = await context.params;
    const parsed = videoAccessRenderJobIdSchema.safeParse(renderJobId);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid render job id' },
        { status: 400 },
      );
    }

    const data = await videoAccessService.getRenderVideoAccess(session, parsed.data);
    return NextResponse.json<ApiResponse<SignedVideoAccess>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    if (error instanceof VideoAccessError) {
      return accessError(error);
    }
    const message = error instanceof Error ? error.message : 'Failed to access video';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
