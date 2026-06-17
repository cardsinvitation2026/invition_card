import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { auditService } from '@/lib/audit';
import { auditEntityIdSchema } from '@/validations/audit.validation';
import type { ApiResponse } from '@/types/api';
import type { AuditTimeline } from '@/types/audit';

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
  context: { params: Promise<{ renderJobId: string }> },
) {
  try {
    await requireSuperAdmin();
    const { renderJobId } = await context.params;
    const parsed = auditEntityIdSchema.safeParse(renderJobId);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid render job id' },
        { status: 400 },
      );
    }

    const timeline = await auditService.getRenderTimeline(parsed.data);
    if (!timeline) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Render job not found' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<AuditTimeline>>({
      success: true,
      data: timeline,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load render audit';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
