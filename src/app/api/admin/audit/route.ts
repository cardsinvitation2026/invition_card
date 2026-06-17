import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { auditService } from '@/lib/audit';
import type { ApiResponse } from '@/types/api';
import type { AuditOverviewSnapshot } from '@/types/audit';

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
    const data = await auditService.getOverview();
    return NextResponse.json<ApiResponse<AuditOverviewSnapshot>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load audit overview';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
