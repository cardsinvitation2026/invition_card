import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { downloadService } from '@/features/downloads';
import { DownloadErrorCode, DownloadServiceError } from '@/features/downloads/download.errors';
import type { ApiResponse } from '@/types/api';

export const runtime = 'nodejs';

interface DownloadSuccessData {
  url: string;
  expiresAt: string;
}

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

function downloadError(error: DownloadServiceError): NextResponse<ApiResponse<null>> {
  const statusByCode: Record<string, number> = {
    [DownloadErrorCode.DOWNLOAD_NOT_FOUND]: 404,
    [DownloadErrorCode.RENDER_NOT_COMPLETED]: 400,
    [DownloadErrorCode.DOWNLOAD_URL_MISSING]: 400,
    [DownloadErrorCode.MEMBERSHIP_REQUIRED]: 403,
    [DownloadErrorCode.DOWNLOAD_LIMIT_REACHED]: 403,
    [DownloadErrorCode.FORBIDDEN]: 403,
  };

  const status = statusByCode[error.code] ?? 400;
  const messageByCode: Record<string, string> = {
    [DownloadErrorCode.DOWNLOAD_NOT_FOUND]: 'Render job not found',
    [DownloadErrorCode.RENDER_NOT_COMPLETED]: 'Render is not completed',
    [DownloadErrorCode.DOWNLOAD_URL_MISSING]: 'Download URL is missing',
    [DownloadErrorCode.MEMBERSHIP_REQUIRED]: 'Active membership required',
    [DownloadErrorCode.DOWNLOAD_LIMIT_REACHED]: 'Download limit reached',
    [DownloadErrorCode.FORBIDDEN]: 'Forbidden',
  };

  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      data: null,
      message: messageByCode[error.code] ?? error.message,
    },
    { status },
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ renderJobId: string }> },
) {
  try {
    const session = await requireSession();
    const { renderJobId } = await context.params;

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    const result = await downloadService.executeDownload(session, renderJobId, {
      ipAddress,
      userAgent,
    });

    return NextResponse.json<ApiResponse<DownloadSuccessData>>({
      success: true,
      data: { url: result.url, expiresAt: result.expiresAt },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    if (error instanceof DownloadServiceError) {
      return downloadError(error);
    }
    const message = error instanceof Error ? error.message : 'Failed to download';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
