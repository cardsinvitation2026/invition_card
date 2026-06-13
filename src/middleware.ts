// Edge-runtime middleware. Verifies the app session JWT and enforces role rules.
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionJwt } from '@/lib/auth/session';
import {
  ADMIN_PATH_PREFIXES,
  APP_SESSION_COOKIE,
  PROTECTED_PATH_PREFIXES,
} from '@/lib/auth/constants';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/drafts/:path*',
    '/downloads/:path*',
    '/account/:path*',
    '/membership/:path*',
    '/checkout/:path*',
    '/admin/:path*',
  ],
};

function isProtectedPath(path: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isAdminPath(path: string): boolean {
  return ADMIN_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(APP_SESSION_COOKIE)?.value;

  const needsAuth = isProtectedPath(pathname) || isAdminPath(pathname);
  if (!needsAuth) return NextResponse.next();

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifySessionJwt(token);
  if (!session || session.status !== 'ACTIVE') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(APP_SESSION_COOKIE);
    return res;
  }

  if (isAdminPath(pathname) && session.role !== 'SUPER_ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
