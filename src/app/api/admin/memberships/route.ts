import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { listAdminMemberships } from '@/lib/admin/memberships';
import { adminMembershipListQuerySchema } from '@/validations/admin-membership.validation';
import type { ApiResponse } from '@/types/api';
import type { AdminMembershipListResult } from '@/types/admin-membership';

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

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = adminMembershipListQuerySchema.safeParse(raw);
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

    const data = await listAdminMemberships(parsed.data);
    return NextResponse.json<ApiResponse<AdminMembershipListResult>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list memberships';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
