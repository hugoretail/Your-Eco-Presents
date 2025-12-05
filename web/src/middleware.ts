import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes protégées (exiger simplement la présence d'un cookie de session)
const PROTECTED_PREFIXES = ['/trouver', '/generate', '/admin', '/compte'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Autoriser sans contrôle: assets, API, pages publiques auth
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
