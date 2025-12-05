import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Lightweight guard: if a route is in this allowlist we only check the presence of the session cookie.
const PROTECTED_PREFIXES = ['/trouver', '/generate', '/admin', '/compte'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow assets and public auth pages to bypass the guard so they stay cacheable/CDN-friendly.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return NextResponse.next();
  }

  if (PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!favicon.ico).*)']
};
