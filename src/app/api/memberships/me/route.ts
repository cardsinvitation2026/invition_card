import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { membershipService } from '@/features/memberships';
import type { ApiResponse } from '@/types/api';
import type { MembershipMeResponse } from '@/types/membership-engine';

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

export async function GET() {
  try {
    const session = await requireSession();
    const data = await membershipService.getMembershipMe(session.userId);
    return NextResponse.json<ApiResponse<MembershipMeResponse>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get membership';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
