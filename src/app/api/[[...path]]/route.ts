import { NextResponse } from 'next/server';

// Stage 1 health endpoint only. Real API routes will be added in later stages.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: { name: 'My Invitations API', stage: 1, status: 'foundation' },
    message: 'Stage 1 architecture is live. No business endpoints yet.',
  });
}
