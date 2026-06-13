// POST /api/auth/logout — clears the session cookie.
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/server';
import type { ApiResponse } from '@/types/api';

export const runtime = 'nodejs';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json<ApiResponse<null>>(
    { success: true, data: null, message: 'Signed out' },
    { status: 200 },
  );
}
