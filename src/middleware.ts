import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 보호가 필요한 경로에만 미들웨어를 적용해 404/공개 페이지에서는 리디렉션이 발생하지 않도록 합니다.

// 메인 도메인 목록 (서브도메인 제외 대상)
const MAIN_DOMAINS = ["talkgate.im", "localhost", "127.0.0.1"];
// 예약된 서브도메인 (프로젝트 서브도메인으로 취급하지 않음)
const RESERVED_SUBDOMAINS = ["www", "api", "api-dev", "dev", "staging", "admin"];
// 쿠키 공유를 위한 루트 도메인
const COOKIE_DOMAIN = ".talkgate.im";

/**
 * 쿠키 도메인을 반환합니다.
 * 모든 서브도메인에서 쿠키를 공유하기 위해 루트 도메인을 반환합니다.
 */
function getCookieDomainFromHost(host: string): string | undefined {
  const hostWithoutPort = host.split(":")[0];
  
  // localhost의 경우 domain 설정하지 않음
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1" || hostWithoutPort.endsWith(".localhost")) {
    return undefined;
  }
  
  // 프로덕션: .talkgate.im으로 설정
  return COOKIE_DOMAIN;
}

/**
 * 호스트에서 서브도메인을 추출합니다.
 * 예: subdomain.talkgate.im → subdomain
 *     talkgate.im → null
 *     www.talkgate.im → null (예약된 서브도메인)
 *     subdomain.localhost:3000 → subdomain
 */
function extractSubdomain(host: string): string | null {
  // 포트 제거
  const hostWithoutPort = host.split(":")[0];
  
  // 메인 도메인 확인
  for (const mainDomain of MAIN_DOMAINS) {
    if (hostWithoutPort === mainDomain) {
      return null; // 메인 도메인 직접 접속
    }
    
    if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
      // 서브도메인 추출: subdomain.talkgate.im → subdomain
      const subdomain = hostWithoutPort.slice(0, -(mainDomain.length + 1));
      
      // 예약된 서브도메인 체크
      if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return null;
      }
      
      // 멀티레벨 서브도메인의 경우 첫 번째 부분만 사용
      // 예: a.b.talkgate.im → a
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
 * 서브도메인으로 프로젝트 정보를 조회합니다.
 */
async function fetchProjectBySubdomain(
  subdomain: string,
  accessToken?: string
): Promise<{ id: number; useAttendanceMenu?: boolean } | null> {
  try {
    const apiBaseUrl = "https://api-dev.talkgate.im"; // env.ts와 동일하게 설정
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${apiBaseUrl}/v1/projects/${subdomain}`, {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      console.log(`[Middleware] 서브도메인 프로젝트 조회 실패: ${subdomain}, status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    // API 응답 형식: { result: true, data: { id, ... } }
    const project = data?.data;
    if (project?.id) {
      console.log(`[Middleware] 서브도메인 프로젝트 발견: ${subdomain} → projectId: ${project.id}`);
      return { id: project.id, useAttendanceMenu: project.useAttendanceMenu };
    }
    
    return null;
  } catch (error) {
    console.error(`[Middleware] 서브도메인 프로젝트 조회 에러:`, error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAuthCookie = Boolean(req.cookies.get("tg_access_token") || req.cookies.get("tg_refresh_token"));
  
  // 1) 미인증 사용자는 보호 경로 접근 시 메인 도메인의 로그인으로 보냄
  if (!hasAuthCookie) {
    const host = req.headers.get("host") || "";
    const subdomain = extractSubdomain(host);
    
    // 서브도메인에서 접속한 경우 메인 도메인으로 리다이렉트
    if (subdomain) {
      const protocol = req.nextUrl.protocol;
      const mainDomain = host.includes("localhost") 
        ? host.replace(`${subdomain}.`, "") // localhost의 경우
        : "talkgate.im";
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
    }
    
    // 메인 도메인에서 접속한 경우 그대로 /login으로
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  
  // 2) 서브도메인 기반 프로젝트 처리
  const host = req.headers.get("host") || "";
  const subdomain = extractSubdomain(host);
  const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
  let hasSelectedProject = Boolean(currentProjectId);
  
  // 서브도메인이 있는 경우: 항상 서브도메인 프로젝트로 처리
  // (다른 프로젝트가 선택되어 있어도 서브도메인 프로젝트로 전환)
  
  if (subdomain) {
    const accessToken = req.cookies.get("tg_access_token")?.value;
    const project = await fetchProjectBySubdomain(subdomain, accessToken);
    
    if (project) {
      const subdomainProjectId = String(project.id);
      
      // 현재 선택된 프로젝트와 서브도메인 프로젝트가 다른 경우 로그 출력
      if (currentProjectId && currentProjectId !== subdomainProjectId) {
        console.log(`[Middleware] 프로젝트 전환: ${currentProjectId} → ${subdomainProjectId} (서브도메인: ${subdomain})`);
      }
      
      // 프로젝트가 선택되지 않았거나, 다른 프로젝트가 선택된 경우 → 서브도메인 프로젝트로 설정
      if (!currentProjectId || currentProjectId !== subdomainProjectId) {
        const response = NextResponse.next();
        
        // 쿠키 설정 (30일 유효, 도메인 공유)
        const maxAge = 60 * 60 * 24 * 30;
        const cookieDomain = getCookieDomainFromHost(host);
        response.cookies.set("tg_selected_project_id", subdomainProjectId, {
          path: "/",
          maxAge,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          ...(cookieDomain && { domain: cookieDomain }),
        });
        
        console.log(`[Middleware] 서브도메인 기반 프로젝트 설정: ${subdomain} → ${subdomainProjectId} (domain: ${cookieDomain || "default"})`);
        return response;
      }
      
      // 이미 올바른 프로젝트가 선택되어 있음
      hasSelectedProject = true;
    } else {
      // 서브도메인이 있지만 프로젝트를 찾지 못함 (유효하지 않은 서브도메인 또는 권한 없음)
      console.log(`[Middleware] 유효하지 않은 서브도메인 또는 접근 권한 없음: ${subdomain}`);
      
      // 유효하지 않은 서브도메인으로 접근 시, 프로젝트 선택 페이지로 리다이렉트
      // (기존에 다른 프로젝트가 선택되어 있더라도 서브도메인이 우선)
      const url = req.nextUrl.clone();
      url.pathname = "/projects";
      url.searchParams.set("error", "invalid_subdomain");
      url.searchParams.set("subdomain", subdomain);
      return NextResponse.redirect(url);
    }
  }
  
  // 3) 서브도메인 없이 접속 + 프로젝트 미선택 상태에서는 프로젝트 선택 페이지로 유도
  if (!subdomain && !hasSelectedProject) {
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


