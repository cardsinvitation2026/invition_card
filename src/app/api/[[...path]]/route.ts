import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

// Generic 404 for any unmatched /api/* path. Specific routes win over this.
export function GET() {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, data: null, message: 'Not found' },
    { status: 404 },
  );
}

export function POST() {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, data: null, message: 'Not found' },
    { status: 404 },
  );
}
