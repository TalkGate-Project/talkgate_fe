import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple client-side session assumption: rely on backend to set HttpOnly cookie.
// The middleware can't read HttpOnly cookie content, but we can use presence
// of a session cookie name if backend sets one (e.g., "session" or similar).
// If unknown, allow through; the page itself will redirect on 401.

const PUBLIC_PATHS = ["/login", "/_next", "/public", "/favicon.ico", "/auth/callback/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Allow backend auth endpoints and our OAuth callback page
  if (pathname.startsWith("/v1/auth/") || pathname.startsWith("/auth/callback/")) {
    return NextResponse.next();
  }

  // If not logged in, redirect to /login (check our auth cookies only)
  const hasAuthCookie = Boolean(req.cookies.get("tg_access_token") || req.cookies.get("tg_refresh_token"));
  if (!hasAuthCookie && pathname !== "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Apply to everything except internal assets and API
  // Ref: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
};


