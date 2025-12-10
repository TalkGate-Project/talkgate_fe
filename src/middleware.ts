import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { setProjectIdCookie, getCookieOptions } from "@/lib/cookies";

// 보호가 필요한 경로에만 미들웨어를 적용
const MAIN_DOMAINS = ["talkgate.im", "localhost", "127.0.0.1"];
const RESERVED_SUBDOMAINS = ["www", "app", "app-dev", "api", "api-dev", "landing", "landing-dev", "dev", "staging", "admin"];

/**
 * 개발 환경인지 확인합니다.
 */
function isDevelopment(host: string): boolean {
  if (process.env.NODE_ENV === "development" || !process.env.VERCEL) {
    return true;
  }
  const hostWithoutPort = host.split(":")[0];
  if (
    hostWithoutPort.includes("localhost") ||
    hostWithoutPort.includes("127.0.0.1") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)
  ) {
    return true;
  }
  return false;
}

/**
 * 호스트에서 서브도메인을 추출합니다.
 */
function extractSubdomain(host: string): string | null {
  const hostWithoutPort = host.split(":")[0];
  
  for (const mainDomain of MAIN_DOMAINS) {
    if (hostWithoutPort === mainDomain) {
      return null;
    }
    
    if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
      const subdomain = hostWithoutPort.slice(0, -(mainDomain.length + 1));
      
      if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return null;
      }
      
      const firstPart = subdomain.split(".")[0];
      if (firstPart && !RESERVED_SUBDOMAINS.includes(firstPart.toLowerCase())) {
        return firstPart;
      }
      
      return null;
    }
  }
  
  return null;
}

/**
 * 현재 환경에 맞는 메인 도메인을 반환합니다.
 */
function getMainDomain(host: string): string {
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return host.replace(/^[^.]+\./, "");
  }
  
  if (host.includes("app.talkgate.im") && !host.includes("app-dev")) {
    return "app.talkgate.im";
  }
  
  return "app-dev.talkgate.im";
}

/**
 * 서브도메인으로 프로젝트 정보를 조회합니다.
 */
async function fetchProjectBySubdomain(
  subdomain: string,
  accessToken: string,
  host: string
): Promise<{ id: number; useAttendanceMenu?: boolean } | null> {
  try {
    const apiBaseUrl = host.includes("app.talkgate.im") && !host.includes("app-dev")
      ? "https://api.talkgate.im"
      : "https://api-dev.talkgate.im";
    
    const response = await fetch(`${apiBaseUrl}/v1/projects/${subdomain}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const responseData = data?.data;
    
    if (typeof responseData === 'number') {
      return { id: responseData };
    }
    
    if (responseData && typeof responseData === 'object' && responseData.id) {
      return { id: responseData.id, useAttendanceMenu: responseData.useAttendanceMenu };
    }
    
    return null;
  } catch (error) {
    console.error(`[Middleware] 서브도메인 프로젝트 조회 에러:`, error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const accessToken = req.cookies.get("tg_access_token")?.value;
  const hasAuthCookie = Boolean(accessToken);

  // ✅ 로그아웃 API는 미들웨어를 통과하지 않음 (matcher에 없음)
  // ✅ API 경로는 미들웨어를 통과하지 않음 (matcher에 없음)
  
  // 개발 환경 감지
  const isDev = isDevelopment(host);

  // 1) 미인증 사용자는 보호 경로 접근 시 로그인으로 리다이렉트
  if (!hasAuthCookie) {
    // 개발 환경이 아닌 경우에만 서브도메인 체크
    if (!isDev) {
      const subdomain = extractSubdomain(host);
      
      // 서브도메인에서 접속한 경우 메인 도메인으로 리다이렉트
      if (subdomain) {
        const protocol = req.nextUrl.protocol;
        const mainDomain = getMainDomain(host);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
    }
    
    // 메인 도메인에서 접속한 경우 그대로 /login으로
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2) 서브도메인 기반 프로젝트 처리
  // 개발 환경에서는 서브도메인 로직을 건너뜀
  if (!isDev) {
    const subdomain = extractSubdomain(host);
    
    if (subdomain && accessToken) {
      const project = await fetchProjectBySubdomain(subdomain, accessToken, host);
      
      if (project) {
        const subdomainProjectId = String(project.id);
        const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
        
        // 서브도메인이 있는 상태에서 /projects로 접근하는 경우
        // 프로젝트 선택 페이지는 접근 허용 (다른 프로젝트로 전환 가능)
        if (pathname.startsWith("/projects/") && pathname !== "/projects") {
          const url = req.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
        
        // 프로젝트가 선택되지 않았거나, 다른 프로젝트가 선택된 경우 → 서브도메인 프로젝트로 설정
        if (!currentProjectId || currentProjectId !== subdomainProjectId) {
          const response = NextResponse.next();
          
          // ✅ 새로운 쿠키 유틸리티 사용
          setProjectIdCookie(response, req, subdomainProjectId);
          
          return response;
        }
      } else {
        // 서브도메인이 있지만 프로젝트를 찾지 못함
        const protocol = req.nextUrl.protocol;
        const mainDomain = getMainDomain(host);
        const redirectUrl = new URL(`${protocol}//${mainDomain}/projects`);
        redirectUrl.searchParams.set("error", "invalid_subdomain");
        redirectUrl.searchParams.set("subdomain", subdomain);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 3) 서브도메인 없이 접속 + 프로젝트 미선택 상태에서는 프로젝트 선택 페이지로 유도
  const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
  const hasSelectedProject = Boolean(currentProjectId);
  
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
    const isException = 
      pathname === "/projects" || 
      pathname.startsWith("/my-settings") ||
      pathname === "/login" ||
      pathname.startsWith("/auth/callback");
    
    if (isProjectRequired && !isException) {
      const url = req.nextUrl.clone();
      url.pathname = "/projects";
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
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
