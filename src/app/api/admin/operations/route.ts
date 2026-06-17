import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { getAdminOperationsSnapshot } from '@/lib/operations';
import { adminOperationsSnapshotSchema } from '@/validations/operations.validation';
import type { ApiResponse } from '@/types/api';
import type { AdminOperationsSnapshot } from '@/types/operations';

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
    const data = await getAdminOperationsSnapshot();
    const parsed = adminOperationsSnapshotSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'Operations snapshot validation failed',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json<ApiResponse<AdminOperationsSnapshot>>({
      success: true,
      data: parsed.data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load operations snapshot';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
