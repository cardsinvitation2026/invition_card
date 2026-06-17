import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { getLaunchReadinessSnapshot } from '@/lib/launch-readiness';
import { launchReadinessSnapshotSchema } from '@/validations/launch-readiness.validation';
import type { ApiResponse } from '@/types/api';
import type { LaunchReadinessSnapshot } from '@/types/launch-readiness';

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
    const data = await getLaunchReadinessSnapshot();
    const parsed = launchReadinessSnapshotSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'Launch readiness snapshot validation failed',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json<ApiResponse<LaunchReadinessSnapshot>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load launch readiness';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
