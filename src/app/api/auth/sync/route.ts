// POST /api/auth/sync
// Verifies a Firebase ID token, upserts the User row, mints app session cookie.
import { NextRequest, NextResponse } from 'next/server';
import { userSyncService } from '@/services/auth/user-sync.service';
import { setSessionCookie } from '@/lib/auth/server';
import { isFirebaseAdminReady } from '@/lib/firebase/admin';
import type { ApiResponse } from '@/types/api';
import type { AppUser } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isFirebaseAdminReady()) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message:
            'Firebase Admin not configured. Use POST /api/auth/dev-login while AUTH_DEV_MODE=true.',
        },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { idToken?: unknown };
    const idToken = typeof body.idToken === 'string' ? body.idToken : '';
    if (!idToken) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'idToken is required' },
        { status: 400 },
      );
    }

    const user = await userSyncService.syncFromFirebaseIdToken(idToken);
    await setSessionCookie({
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
      status: user.status,
      provider: 'google',
    });

    return NextResponse.json<ApiResponse<{ user: AppUser }>>(
      { success: true, data: { user }, message: 'Signed in' },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'sync failed';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
