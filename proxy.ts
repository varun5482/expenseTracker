import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

const PUBLIC_PATH_PREFIXES = ['/auth', '/_next', '/favicon.ico', '/icon-192.png', '/icon-512.png', '/sw.js'];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname === '/manifest.webmanifest') {
    return response;
  }

  const hasAuthCookie = request.cookies.getAll().some((cookie: { name: string }) => cookie.name.startsWith('sb-'));

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
