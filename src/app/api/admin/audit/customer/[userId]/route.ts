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

async function timelineRoute(
  loader: () => Promise<AuditTimeline | null>,
  notFoundMessage: string,
) {
  const timeline = await loader();
  if (!timeline) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: notFoundMessage },
      { status: 404 },
    );
  }
  return NextResponse.json<ApiResponse<AuditTimeline>>({
    success: true,
    data: timeline,
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireSuperAdmin();
    const { userId } = await context.params;
    const parsed = auditEntityIdSchema.safeParse(userId);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid user id' },
        { status: 400 },
      );
    }
    return timelineRoute(
      () => auditService.getCustomerTimeline(parsed.data),
      'Customer not found',
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load customer audit';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
