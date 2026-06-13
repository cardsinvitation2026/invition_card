// POST /api/auth/dev-login
// Available only when AUTH_DEV_MODE=true. Creates / fetches a User and mints
// an app session cookie without contacting Firebase. For preview environments.
import { NextRequest, NextResponse } from 'next/server';
import { isAuthDevModeServer } from '@/lib/auth/dev-mode';
import { userService } from '@/features/users/user.service';
import { setSessionCookie } from '@/lib/auth/server';
import { createHash } from 'node:crypto';
import type { ApiResponse } from '@/types/api';
import type { AppUser } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isAuthDevModeServer()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Dev login is disabled (AUTH_DEV_MODE=false).' },
      { status: 403 },
    );
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      name?: unknown;
    };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'A valid email is required.' },
        { status: 400 },
      );
    }
    // Deterministic synthetic firebaseUid so re-logging in finds the same row.
    const firebaseUid = 'dev_' + createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 24);

    const user = await userService.syncFromAuth({
      firebaseUid,
      email,
      name: name || null,
      photoUrl: null,
    });

    await setSessionCookie({
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
      status: user.status,
      provider: 'dev',
    });

    return NextResponse.json<ApiResponse<{ user: AppUser }>>(
      { success: true, data: { user }, message: 'Dev session created' },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'dev-login failed';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
