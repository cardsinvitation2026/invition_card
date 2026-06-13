// Health endpoint — moved off the catch-all so /api/auth/* routes win.
import { NextResponse } from 'next/server';
import { hasDatabaseUrl, hasFirebaseAdminConfig, hasFirebaseClientConfig, isAuthDevModeServer } from '@/lib/auth/dev-mode';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    success: true,
    data: {
      name: 'My Invitations API',
      stage: 3,
      status: 'auth-architecture-ready',
      devMode: isAuthDevModeServer(),
      integrations: {
        database: hasDatabaseUrl() ? 'configured' : 'placeholder',
        firebaseClient: hasFirebaseClientConfig() ? 'configured' : 'placeholder',
        firebaseAdmin: hasFirebaseAdminConfig() ? 'configured' : 'placeholder',
      },
    },
  });
}
