import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 보호가 필요한 경로에만 미들웨어를 적용해 404/공개 페이지에서는 리디렉션이 발생하지 않도록 합니다.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAuthCookie = Boolean(req.cookies.get("tg_access_token") || req.cookies.get("tg_refresh_token"));
  // 1) 미인증 사용자는 보호 경로 접근 시 로그인으로 보냄
  if (!hasAuthCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // 2) 인증되었지만 프로젝트 미선택 상태에서는 프로젝트가 필요한 경로 접근 시 /projects로 유도
  const hasSelectedProject = Boolean(req.cookies.get("tg_selected_project_id"));
  if (!hasSelectedProject) {
    const projectRequiredPrefixes = [
      "/dashboard",
      "/consult",
      "/customers",
      "/stats",
      "/attendance",
      "/notices",
      "/settings",
      "/notifications",
    ];
    const isProjectRequired = projectRequiredPrefixes.some((p) => pathname.startsWith(p));
    const isException = pathname === "/projects" || pathname.startsWith("/my-settings");
    if (isProjectRequired && !isException) {
      const url = req.nextUrl.clone();
      url.pathname = "/projects";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  // 보호 경로에만 제한적으로 미들웨어를 적용
  matcher: [
    '/dashboard/:path*',
    '/consult/:path*',
    '/customers/:path*',
    '/stats/:path*',
    '/projects/:path*',
    '/notices/:path*',
    '/attendance/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/my-settings/:path*',
  ],
};


