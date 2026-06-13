// GET /api/auth/me — returns the current authenticated user (or null).
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { userService } from '@/features/users/user.service';
import type { ApiResponse } from '@/types/api';
import type { AppUser } from '@/types/user';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json<ApiResponse<{ user: AppUser | null }>>(
      { success: true, data: { user: null }, message: 'unauthenticated' },
      { status: 200 },
    );
  }
  const user = await userService.getById(session.userId);
  return NextResponse.json<ApiResponse<{ user: AppUser | null }>>(
    { success: true, data: { user } },
    { status: 200 },
  );
}
