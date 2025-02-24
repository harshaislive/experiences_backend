import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the current path
  const path = new URL(req.url).pathname;

  // If user is not signed in and trying to access a protected route
  if (!session && path.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('returnUrl', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and trying to access login page
  if (session && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
