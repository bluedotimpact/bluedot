import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import env from './lib/api/env';
import { SITE_AUTH_COOKIE, checkAuthToken } from './lib/siteAuth';

export async function middleware(request: NextRequest) {
  if (!env.SITE_ACCESS_PASSWORD) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Don't protect the login page or its API route
  if (pathname === '/site-login' || pathname === '/api/site-login') {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(SITE_AUTH_COOKIE);
  const authorized = await checkAuthToken(authCookie?.value);
  if (authorized) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const returnTo = pathname + url.search;
  url.pathname = '/site-login';
  url.search = `?returnTo=${encodeURIComponent(returnTo)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/|favicon\\.ico|favicon\\.svg|apple-touch-icon\\.png|robots\\.txt|images/|fonts/|animations/).*)',
  ],
};
