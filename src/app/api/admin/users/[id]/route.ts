import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { enrichAdminUserDetail } from '@/lib/admin/user-enrichment';
import type { ApiResponse } from '@/types/api';
import type { AdminUserDetail } from '@/types/admin-user';

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const detail = await enrichAdminUserDetail(id);
    if (!detail) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<AdminUserDetail>>({
      success: true,
      data: detail,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load user';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
