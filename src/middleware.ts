import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 보호가 필요한 경로에만 미들웨어를 적용해 404/공개 페이지에서는 리디렉션이 발생하지 않도록 합니다.
// NOTE: 쿠키 도메인은 명시하지 않고 Path=/만 사용하여 현재 도메인에 자동 설정되도록 합니다.

// 메인 도메인 목록 (서브도메인 제외 대상)
const MAIN_DOMAINS = ["talkgate.im", "localhost", "127.0.0.1"];
// 예약된 서브도메인 (프로젝트 서브도메인으로 취급하지 않음)
// app, app-dev: 메인 서비스 애플리케이션
// api, api-dev: API 서버
// landing, landing-dev: 랜딩 페이지
const RESERVED_SUBDOMAINS = ["www", "app", "app-dev", "api", "api-dev", "landing", "landing-dev", "dev", "staging", "admin"];

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
 * 현재 환경에 맞는 API 베이스 URL을 반환합니다.
 */
function getApiBaseUrl(host: string): string {
  // 프로덕션 환경 (app.talkgate.im)
  if (host.includes("app.talkgate.im") && !host.includes("app-dev")) {
    return "https://api.talkgate.im";
  }
  // 개발 환경 (app-dev.talkgate.im, localhost, vercel preview)
  return "https://api-dev.talkgate.im";
}

/**
 * 현재 환경에 맞는 메인 도메인을 반환합니다.
 */
function getMainDomain(host: string): string {
  // localhost 환경
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return host.replace(/^[^.]+\./, ""); // 서브도메인 제거
  }
  
  // 프로덕션 환경 (app.talkgate.im)
  if (host.includes("app.talkgate.im") && !host.includes("app-dev")) {
    return "app.talkgate.im";
  }
  
  // 개발 환경 (app-dev.talkgate.im, vercel preview)
  return "app-dev.talkgate.im";
}

/**
 * Base64URL 디코딩 (Edge Runtime 호환)
 * Edge Runtime에서는 atob 사용 가능
 */
function base64UrlDecode(str: string): string {
  // Base64URL을 Base64로 변환
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // 패딩 추가
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // atob는 Edge Runtime에서 사용 가능
  return atob(base64);
}

/**
 * JWT 토큰의 만료 시간을 디코딩합니다.
 * 주의: 서명 검증은 하지 않으며, 만료 시간만 확인합니다.
 */
function decodeJwtExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Base64URL 디코딩 (Edge Runtime 호환)
    const decoded = base64UrlDecode(payload);
    const parsed = JSON.parse(decoded);
    
    // exp는 Unix timestamp (초 단위)
    return parsed.exp ? parsed.exp * 1000 : null; // 밀리초로 변환
  } catch (error) {
    console.error('[Middleware] JWT 디코딩 실패:', error);
    return null;
  }
}

/**
 * 토큰이 만료되었거나 곧 만료될 예정인지 확인합니다.
 * 최적화: JWT 디코딩은 매우 빠르지만(마이크로초 단위), 
 * 실제로는 토큰이 만료된 경우에만 리프레시 API 호출이 발생하므로
 * 대부분의 요청에서는 단순한 체크만 수행됩니다.
 * 
 * @param token 액세스 토큰
 * @param bufferMs 만료 전 버퍼 시간 (기본 5분)
 * @returns 만료되었거나 곧 만료될 예정이면 true
 */
function isTokenExpiredOrExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  try {
    const expiration = decodeJwtExpiration(token);
    if (!expiration) {
      // 디코딩 실패 시 만료된 것으로 간주 (안전한 기본값)
      return true;
    }
    
    const now = Date.now();
    // 만료 시간이 현재 시간 + 버퍼 시간보다 작거나 같으면 만료된 것으로 간주
    return expiration <= now + bufferMs;
  } catch (error) {
    // 에러 발생 시 만료된 것으로 간주 (안전한 기본값)
    console.error('[Middleware] 토큰 만료 확인 중 에러:', error);
    return true;
  }
}

/**
 * 토큰을 리프레시합니다.
 */
async function refreshAccessToken(
  refreshToken: string,
  host: string
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  try {
    const apiBaseUrl = getApiBaseUrl(host);
    const refreshResponse = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      console.log('[Middleware] 토큰 리프레시 실패:', refreshResponse.status);
      return null;
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData?.data?.accessToken || refreshData?.accessToken;
    const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken;

    if (!newAccessToken) {
      console.log('[Middleware] 토큰 리프레시 응답에 accessToken 없음');
      return null;
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('[Middleware] 토큰 리프레시 에러:', error);
    return null;
  }
}

/**
 * 쿠키 삭제 헤더를 추가합니다.
 * 
 * 중요: httpOnly 쿠키는 서버에서만 삭제할 수 있으며,
 * 미들웨어와 Route Handler 모두에서 NextResponse.cookies.set()을 사용하여
 * maxAge: 0 또는 expires를 과거 날짜로 설정하여 삭제할 수 있습니다.
 * 
 * 쿠키 삭제 시 주의사항:
 * - 쿠키를 설정할 때 사용한 것과 동일한 속성(path, domain, secure, sameSite)을 사용해야 합니다.
 * - 프로덕션 환경에서는 Domain 속성이 있는 쿠키와 없는 쿠키를 모두 삭제해야 할 수 있습니다.
 */
function addCookieDeletionHeaders(response: NextResponse, request: NextRequest): void {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
  const isSecure = request.nextUrl.protocol === 'https:';

  // 쿠키 삭제 옵션 (로그인 API에서 쿠키를 설정할 때 사용한 옵션과 동일)
  const cookieOptions = {
    path: '/',
    maxAge: 0, // 0으로 설정하여 즉시 만료
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    ...(isProduction && { domain: '.talkgate.im' }),
  };

  // 삭제할 쿠키 목록
  const cookiesToDelete = ['tg_access_token', 'tg_refresh_token', 'tg_selected_project_id'];
  
  cookiesToDelete.forEach(name => {
    // 프로덕션 환경: Domain 속성이 있는 쿠키 삭제
    if (isProduction) {
      response.cookies.set(name, '', { ...cookieOptions, domain: '.talkgate.im' });
      // 브라우저 호환성을 위해 Domain 속성 없는 버전도 삭제 시도
      response.cookies.set(name, '', { ...cookieOptions, domain: undefined });
    } else {
      // 개발 환경: Domain 속성 없이 삭제
      response.cookies.set(name, '', { ...cookieOptions, domain: undefined });
    }
  });
  
  console.log('[Middleware] 🍪 쿠키 삭제 헤더 추가:', {
    cookiesToDelete,
    isProduction,
    isSecure,
  });
}

/**
 * 쿠키 옵션을 생성합니다.
 */
function getCookieOptions(request: NextRequest): {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax' | 'strict';
  domain?: string;
  maxAge?: number;
} {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
  const isSecure = request.nextUrl.protocol === 'https:';

  return {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    ...(isProduction && { domain: '.talkgate.im' }),
    maxAge: 60 * 60 * 24 * 30, // 30일
  };
}

/**
 * 서브도메인으로 프로젝트 정보를 조회합니다.
 */
async function fetchProjectBySubdomain(
  subdomain: string,
  accessToken?: string,
  host?: string
): Promise<{ id: number; useAttendanceMenu?: boolean } | null> {
  try {
    const apiBaseUrl = getApiBaseUrl(host || "");
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
    // API 응답 형식: { result: true, data: 2 } 또는 { result: true, data: { id: 2, ... } }
    const responseData = data?.data;
    
    // data가 숫자인 경우 (프로젝트 ID만 반환)
    if (typeof responseData === 'number') {
      console.log(`[Middleware] 서브도메인 프로젝트 발견: ${subdomain} → projectId: ${responseData}`);
      return { id: responseData };
    }
    
    // data가 객체인 경우 (프로젝트 객체 반환)
    if (responseData && typeof responseData === 'object' && responseData.id) {
      console.log(`[Middleware] 서브도메인 프로젝트 발견: ${subdomain} → projectId: ${responseData.id}`);
      return { id: responseData.id, useAttendanceMenu: responseData.useAttendanceMenu };
    }
    
    console.log(`[Middleware] 서브도메인 프로젝트 조회 실패: ${subdomain}, 예상치 못한 응답 형식:`, data);
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
  const refreshToken = req.cookies.get("tg_refresh_token")?.value;
  const hasAuthCookie = Boolean(accessToken || refreshToken);
  
  // 1) 미인증 사용자는 보호 경로 접근 시 메인 도메인의 로그인으로 보냄
  if (!hasAuthCookie) {
    const subdomain = extractSubdomain(host);
    
    // 서브도메인에서 접속한 경우 메인 도메인으로 리다이렉트
    if (subdomain) {
      const protocol = req.nextUrl.protocol;
      const mainDomain = getMainDomain(host);
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
    }
    
    // 메인 도메인에서 접속한 경우 그대로 /login으로
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2) 액세스 토큰 만료 확인 및 리프레시
  // 미들웨어는 스트리밍 시작 전에 실행되므로 쿠키 조작이 가능합니다.
  // 
  // 성능 최적화:
  // - JWT 디코딩은 매우 빠릅니다 (마이크로초 단위, Base64 디코딩 + JSON 파싱)
  // - 실제 리프레시 API 호출은 토큰이 만료된 경우에만 발생
  // - 대부분의 요청(토큰 유효)에서는 단순한 체크만 수행되므로 오버헤드가 미미함
  // - 토큰이 만료된 경우에만 추가 네트워크 요청 발생
  if (accessToken && isTokenExpiredOrExpiringSoon(accessToken)) {
    console.log('[Middleware] 🔄 액세스 토큰 만료 또는 곧 만료 예정 - 리프레시 시도');
    
    if (!refreshToken) {
      console.log('[Middleware] ❌ 리프레시 토큰 없음 - 로그아웃 처리');
      const protocol = req.nextUrl.protocol;
      const mainDomain = getMainDomain(host);
      const loginUrl = new URL(`${protocol}//${mainDomain}/login`);
      const redirectResponse = NextResponse.redirect(loginUrl);
      addCookieDeletionHeaders(redirectResponse, req);
      return redirectResponse;
    }

    const newTokens = await refreshAccessToken(refreshToken, host);
    
    if (!newTokens) {
      console.log('[Middleware] ❌ 토큰 리프레시 실패 - 로그아웃 처리');
      const protocol = req.nextUrl.protocol;
      const mainDomain = getMainDomain(host);
      const loginUrl = new URL(`${protocol}//${mainDomain}/login`);
      const redirectResponse = NextResponse.redirect(loginUrl);
      addCookieDeletionHeaders(redirectResponse, req);
      return redirectResponse;
    }

    // 새 토큰을 쿠키에 설정
    console.log('[Middleware] ✅ 토큰 리프레시 성공 - 새 토큰 설정');
    const response = NextResponse.next();
    const cookieOptions = getCookieOptions(req);
    
    response.cookies.set('tg_access_token', newTokens.accessToken, cookieOptions);
    if (newTokens.refreshToken) {
      response.cookies.set('tg_refresh_token', newTokens.refreshToken, cookieOptions);
    }

    // 서브도메인 프로젝트 조회를 위해 새 토큰 사용
    // (아래 로직에서 사용할 수 있도록 response 객체에 새 토큰 정보 저장 필요)
    // 하지만 현재 구조상 response 객체에 커스텀 데이터를 저장할 수 없으므로,
    // 새 토큰을 사용하여 프로젝트 조회를 다시 수행할 수 없습니다.
    // 대신, 쿠키에 이미 설정되었으므로 다음 요청에서 사용될 것입니다.
    
    // 새 토큰으로 프로젝트 조회 시도 (서브도메인이 있는 경우)
    const subdomain = extractSubdomain(host);
    if (subdomain) {
      const project = await fetchProjectBySubdomain(subdomain, newTokens.accessToken, host);
      if (project) {
        const subdomainProjectId = String(project.id);
        const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
        
        if (!currentProjectId || currentProjectId !== subdomainProjectId) {
          response.cookies.set("tg_selected_project_id", subdomainProjectId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: cookieOptions.sameSite,
            secure: cookieOptions.secure,
            ...(cookieOptions.domain && { domain: cookieOptions.domain }),
          });
        }
        
        // /projects 경로 접근 시 /dashboard로 리다이렉트
        if (pathname === "/projects" || pathname.startsWith("/projects/")) {
          const url = req.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      }
    }
    
    return response;
  }
  
  // 3) 서브도메인 기반 프로젝트 처리
  // (토큰이 리프레시되지 않은 경우, 또는 리프레시되었지만 서브도메인이 없는 경우)
  const subdomain = extractSubdomain(host);
  const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
  let hasSelectedProject = Boolean(currentProjectId);
  
  // 서브도메인이 있는 경우: 항상 서브도메인 프로젝트로 처리
  // (다른 프로젝트가 선택되어 있어도 서브도메인 프로젝트로 전환)
  
  if (subdomain) {
    const project = await fetchProjectBySubdomain(subdomain, accessToken, host);
    
    if (project) {
      const subdomainProjectId = String(project.id);
      
      // 서브도메인이 있는 상태에서 /projects로 접근하는 것은 논리적으로 맞지 않음
      // 프로젝트가 이미 선택된 상태이므로 대시보드로 리다이렉트
      if (pathname === "/projects" || pathname.startsWith("/projects/")) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      
      // 현재 선택된 프로젝트와 서브도메인 프로젝트가 다른 경우 로그 출력
      if (currentProjectId && currentProjectId !== subdomainProjectId) {
        console.log(`[Middleware] 프로젝트 전환: ${currentProjectId} → ${subdomainProjectId} (서브도메인: ${subdomain})`);
      }
      
      // 프로젝트가 선택되지 않았거나, 다른 프로젝트가 선택된 경우 → 서브도메인 프로젝트로 설정
      if (!currentProjectId || currentProjectId !== subdomainProjectId) {
        const response = NextResponse.next();
        
        // 쿠키 설정 (30일 유효, 도메인은 명시하지 않음 - 현재 도메인에 자동 설정)
        const maxAge = 60 * 60 * 24 * 30;
        const isSecure = req.nextUrl.protocol === "https:";
        response.cookies.set("tg_selected_project_id", subdomainProjectId, {
          path: "/",
          maxAge,
          sameSite: isSecure ? "none" : "lax",
          secure: isSecure,
        });
        
        return response;
      }
      
      // 이미 올바른 프로젝트가 선택되어 있음
      hasSelectedProject = true;
    } else {
      // 서브도메인이 있지만 프로젝트를 찾지 못함 (유효하지 않은 서브도메인 또는 권한 없음)
      console.log(`[Middleware] 유효하지 않은 서브도메인 또는 접근 권한 없음: ${subdomain}`);
      
      // 유효하지 않은 서브도메인으로 접근 시, 메인 도메인의 프로젝트 선택 페이지로 리다이렉트
      // 같은 서브도메인으로 리다이렉트하면 무한 루프가 발생하므로 메인 도메인으로 이동
      const protocol = req.nextUrl.protocol;
      const mainDomain = getMainDomain(host);
      const redirectUrl = new URL(`${protocol}//${mainDomain}/projects`);
      redirectUrl.searchParams.set("error", "invalid_subdomain");
      redirectUrl.searchParams.set("subdomain", subdomain);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // 4) 서브도메인 없이 접속 + 프로젝트 미선택 상태에서는 프로젝트 선택 페이지로 유도
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


