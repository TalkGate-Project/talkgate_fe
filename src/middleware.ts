import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { setProjectIdCookie, setAttendanceMenuCookie, setProjectTypeCookie, deleteAuthCookies } from "@/lib/cookies";
import type { Project } from "@/types/projects";
import type { ApiSuccess } from "@/types/common";
import { logger } from "@/lib/logger";
import { isMobileDeviceUserAgent } from "@/lib/device";

// 보호가 필요한 경로에만 미들웨어를 적용
const MAIN_DOMAINS = ["talkgate.im", "localhost", "127.0.0.1"];
const RESERVED_SUBDOMAINS = ["www", "app", "app-dev", "api", "api-dev", "landing", "landing-dev", "dev", "staging", "admin"];

// 비회원 전용 경로 (서브도메인 불가)
const UNAUTHENTICATED_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
];

// 인증 필수 + 프로젝트 필수 경로 (서브도메인 필수)
const AUTHENTICATED_PROJECT_PATHS = [
  "/dashboard",
  "/consult",
  "/customers",
  "/stats",
  "/debt-relief",
  "/attendance",
  "/notices",
  "/settings",
];

// 인증 필수 + 프로젝트 선택 경로 (서브도메인 불가)
const PROJECT_SELECTION_PATHS = [
  "/projects",
];

// 인증 필수 + 서브도메인 선택적 경로
const AUTHENTICATED_OPTIONAL_SUBDOMAIN_PATHS = [
  "/my-settings",
  "/notifications",
];

// 인증 필수 + 소셜 회원가입 관련 경로 (서브도메인 불필요)
const SOCIAL_SIGNUP_PATHS = [
  "/social-signup",
  "/project-signup",
];

/**
 * 개발 환경인지 확인합니다.
 * NODE_ENV === "development"이거나 localhost인 경우만 개발 환경으로 간주합니다.
 * Vercel 체크를 제거하여 Amplify 등 다른 배포 환경에서도 정상 동작하도록 합니다.
 */
function isDevelopment(host: string): boolean {
  // NODE_ENV가 development인 경우
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  
  // host 기반으로 localhost 환경 감지
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
 * NEXT_PUBLIC_SITE_URL 환경변수에서 추출하며, 환경변수를 참조하지 못한 경우 app-dev.talkgate.im으로 폴백합니다.
 * host 기반 판단은 제거되어 의도치 않은 프로덕션 도메인으로의 리다이렉트를 방지합니다.
 */
function getMainDomain(_host: string): string {
  // NEXT_PUBLIC_SITE_URL에서 메인 도메인 추출 (host 기반 판단 제거)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return "app-dev.talkgate.im";
  
  try {
    const url = new URL(siteUrl);
    const port = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";
    return `${url.hostname}${port}`;
  } catch {
    // URL 파싱 실패 시 문자열에서 프로토콜만 제거
    return siteUrl.replace(/^https?:\/\//, "").split("/")[0];
  }
}

/**
 * 서브도메인으로 프로젝트 정보를 조회합니다.
 * GET /v1/projects/{subDomain} 응답(Project 전체)을 반환합니다.
 */
async function fetchProjectBySubdomain(
  subdomain: string,
  accessToken: string,
  host: string
): Promise<Project | null> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-dev.talkgate.im";

    const response = await fetch(`${apiBaseUrl}/v1/projects/${subdomain}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as ApiSuccess<Project>;
    const data = json?.data;

    if (data && typeof data === "object" && typeof data.id === "number") {
      return data as Project;
    }

    return null;
  } catch (error) {
    logger.serverError(`[Middleware] 서브도메인 프로젝트 조회 에러:`, error);
    return null;
  }
}

/**
 * 경로가 특정 패턴에 해당하는지 확인합니다.
 */
function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent");
  const accessToken = req.cookies.get("tg_access_token")?.value;
  const refreshToken = req.cookies.get("tg_refresh_token")?.value;
  const hasAuthCookie = Boolean(accessToken || refreshToken);
  const protocol = req.nextUrl.protocol;

  // UI Zoom 설정을 위한 헤더 처리
  // 기본값은 normal (1.0)로 시작하고, 데스크톱(>=1080)은 클라이언트에서 compact(0.8) 적용
  let uiZoomMode = "normal";
  
  // 1. 모바일 기기는 무조건 normal (1.0) - 서버사이드에서 User-Agent로 감지
  const isMobile = isMobileDeviceUserAgent(userAgent);
  if (isMobile) {
    uiZoomMode = "normal";
  }
  
  // 2. 인증 관련 페이지는 normal (1.0)
  const isAuthPath = matchesPath(pathname, [
    "/login", 
    "/signup", 
    "/social-signup", 
    "/project-signup",
    "/forgot-password", 
    "/invite", 
    "/auth/callback",
    "/logout"
  ]);

  if (isAuthPath) {
    uiZoomMode = "normal";
  }

  // Request Headers에 x-ui-zoom 추가
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-ui-zoom", uiZoomMode);

  // 개발 환경 감지
  const isDev = isDevelopment(host);

  // 서브도메인 추출 (개발/배포 모두에서 사용)
  const subdomain = extractSubdomain(host);
  const mainDomain = getMainDomain(host);

  // 개발 환경에서는 서브도메인 로직 건너뜀 (단, 비회원 경로는 서브도메인 제거)
  if (isDev) {
    // 비회원 경로는 서브도메인 제거 (소셜 로그인 callback URL 검증 오류 방지)
    if (matchesPath(pathname, UNAUTHENTICATED_PATHS)) {
      if (subdomain) {
        logger.server(`[Middleware] 개발환경 - 비회원 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트: ${pathname}`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}${pathname}${req.nextUrl.search}`));
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // 미인증 사용자가 보호 경로 접근 시 로그인으로 리다이렉트 (서브도메인 제거)
    if (!hasAuthCookie) {
      const isProtectedPath = matchesPath(pathname, [
        ...AUTHENTICATED_PROJECT_PATHS,
        ...PROJECT_SELECTION_PATHS,
        ...AUTHENTICATED_OPTIONAL_SUBDOMAIN_PATHS,
      ]);
      
      if (isProtectedPath) {
        // 서브도메인이 있으면 메인 도메인으로 리다이렉트
        if (subdomain) {
          logger.server(`[Middleware] 개발환경 - 보호 경로 + 서브도메인 + 비인증 → 메인도메인 로그인으로 리다이렉트`);
          return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
        }
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }

    // 프로젝트 미선택 상태에서 프로젝트 필수 경로 접근 시
    if (hasAuthCookie) {
      const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
      const hasSelectedProject = Boolean(currentProjectId);
      
      if (!hasSelectedProject && matchesPath(pathname, AUTHENTICATED_PROJECT_PATHS)) {
        const url = req.nextUrl.clone();
        url.pathname = "/projects";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ============================================
  // 배포 환경 (Vercel) - 루트 경로 처리
  // ============================================

  if (pathname === "/") {
    // 서브도메인이 있는 경우 (프로젝트 컨텍스트)
    if (subdomain) {
      if (hasAuthCookie && accessToken) {
        // 인증됨 + 서브도메인 → 프로젝트 확인 후 대시보드로 리다이렉트
        const project = await fetchProjectBySubdomain(subdomain, accessToken, host);
        
        if (project) {
          logger.server(`[Middleware] 루트 + 서브도메인 + 인증됨 → /dashboard로 리다이렉트`);
          const response = NextResponse.redirect(new URL(`${protocol}//${host}/dashboard`));
          // 프로젝트 ID 쿠키도 설정
          const subdomainProjectId = String(project.id);
          const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;
          if (!currentProjectId || currentProjectId !== subdomainProjectId) {
            setProjectIdCookie(response, req, subdomainProjectId);
          }
          // 근태 메뉴 사용 여부도 쿠키로 설정 (서브도메인 최초 진입 시 localStorage는 비어있을 수 있음)
          if (typeof project.useAttendanceMenu === "boolean") {
            const currentAttendance = req.cookies.get("tg_use_attendance_menu")?.value;
            const nextAttendance = String(project.useAttendanceMenu);
            if (currentAttendance !== nextAttendance) {
              setAttendanceMenuCookie(response, req, project.useAttendanceMenu);
            }
          }
          if (project.type) {
            const currentProjectType = req.cookies.get("tg_project_type")?.value;
            if (currentProjectType !== project.type) {
              setProjectTypeCookie(response, req, project.type);
            }
          }
          return response;
        } else {
          // 유효하지 않은 서브도메인 → 프로젝트 선택 페이지로
          logger.server(`[Middleware] 루트 + 유효하지 않은 서브도메인: ${subdomain}`);
          const redirectUrl = new URL(`${protocol}//${mainDomain}/projects`);
          redirectUrl.searchParams.set("error", "invalid_subdomain");
          redirectUrl.searchParams.set("subdomain", subdomain);
          return NextResponse.redirect(redirectUrl);
        }
      } else {
        // 비인증 + 서브도메인 → 메인 도메인 로그인으로 리다이렉트
        logger.server(`[Middleware] 루트 + 서브도메인 + 비인증 → 메인도메인 로그인으로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
    } else {
      // 서브도메인이 없는 경우 (메인 도메인)
      if (hasAuthCookie) {
        // 인증됨 + 메인 도메인 → 프로젝트 선택으로 리다이렉트
        logger.server(`[Middleware] 루트 + 메인도메인 + 인증됨 → /projects로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/projects`));
      } else {
        // 비인증 + 메인 도메인 → 로그인으로 리다이렉트
        logger.server(`[Middleware] 루트 + 메인도메인 + 비인증 → /login으로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
    }
  }

  // ============================================
  // 1. 비회원 경로 처리 (/login, /signup, /forgot-password, /auth/callback)
  //    - 서브도메인이 있으면 메인 도메인으로 리다이렉트
  // ============================================
  if (matchesPath(pathname, UNAUTHENTICATED_PATHS)) {
    if (subdomain) {
      logger.server(`[Middleware] 비회원 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트: ${pathname}`);
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}${pathname}${req.nextUrl.search}`));
    }
    
    // 이미 인증된 사용자가 로그인 페이지 접근 시 적절한 페이지로 리다이렉트
    // (클라이언트 측에서 처리하므로 여기서는 pass)
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ============================================
  // 2. 프로젝트 선택 경로 (/projects) 처리
  //    - 서브도메인이 있으면 메인 도메인으로 리다이렉트
  //    - 비인증 시 로그인으로 리다이렉트
  // ============================================
  if (matchesPath(pathname, PROJECT_SELECTION_PATHS)) {
    // 비인증 시 로그인으로
    if (!hasAuthCookie) {
      logger.server(`[Middleware] 프로젝트 경로 + 비인증 → 로그인으로 리다이렉트`);
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
    }
    
    // 서브도메인이 있으면 메인 도메인으로
    if (subdomain) {
      logger.server(`[Middleware] 프로젝트 선택 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트`);
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}${pathname}`));
    }
    
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ============================================
  // 3. 인증 필수 + 프로젝트 필수 경로 처리
  //    - 비인증 시 로그인으로 리다이렉트
  //    - 서브도메인 없이 접근 시 쿠키 청소 후 로그인으로 리다이렉트
  //    - 서브도메인 있으면 프로젝트 ID 확인/설정
  // ============================================
  if (matchesPath(pathname, AUTHENTICATED_PROJECT_PATHS)) {
    // 비인증 시 로그인으로
    if (!hasAuthCookie) {
      if (subdomain) {
        logger.server(`[Middleware] 보호 경로 + 서브도메인 + 비인증 → 메인도메인 로그인으로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
      logger.server(`[Middleware] 보호 경로 + 비인증 → 로그인으로 리다이렉트`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 인증됨 + 서브도메인 없음 → 쿠키 청소 후 로그인으로 리다이렉트
    if (!subdomain) {
      logger.server(`[Middleware] 인증된 보호경로 + 서브도메인 없음 → 쿠키 청소 후 로그인으로 리다이렉트`);
      const response = NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      deleteAuthCookies(response, req);
      return response;
    }

    // 인증됨 + 서브도메인 있음 → 프로젝트 정보 확인
    if (subdomain && accessToken) {
      const project = await fetchProjectBySubdomain(subdomain, accessToken, host);

      if (project) {
        // 회생·파산 미지원 프로젝트 타입(general)인데 /debt-relief를 직접 주소로 접근한 경우 차단
        if (
          matchesPath(pathname, ["/debt-relief"]) &&
          project.type !== "analysis" &&
          project.type !== "lawyer"
        ) {
          logger.server(
            `[Middleware] 회생·파산 미지원 프로젝트 타입(${project.type}) + /debt-relief 접근 → 대시보드로 리다이렉트`
          );
          const redirectUrl = new URL(`${protocol}//${host}/dashboard`);
          redirectUrl.searchParams.set("error", "debt_relief_unavailable");
          return NextResponse.redirect(redirectUrl);
        }

        const subdomainProjectId = String(project.id);
        const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;

        const currentAttendance = req.cookies.get("tg_use_attendance_menu")?.value;
        const nextAttendance =
          typeof project.useAttendanceMenu === "boolean" ? String(project.useAttendanceMenu) : null;
        const currentProjectType = req.cookies.get("tg_project_type")?.value;
        const nextProjectType = project.type || null;

        const shouldSetProjectId = !currentProjectId || currentProjectId !== subdomainProjectId;
        const shouldSetAttendance = nextAttendance !== null && currentAttendance !== nextAttendance;
        const shouldSetProjectType = nextProjectType !== null && currentProjectType !== nextProjectType;

        if (shouldSetProjectId || shouldSetAttendance || shouldSetProjectType) {
          if (shouldSetProjectId) {
            logger.server(`[Middleware] 프로젝트 ID 설정: ${subdomainProjectId}`);
          }
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          if (shouldSetProjectId) {
            setProjectIdCookie(response, req, subdomainProjectId);
          }
          if (shouldSetAttendance && nextAttendance !== null) {
            setAttendanceMenuCookie(response, req, nextAttendance === "true");
          }
          if (shouldSetProjectType && nextProjectType !== null) {
            setProjectTypeCookie(response, req, nextProjectType);
          }
          return response;
        }

        return NextResponse.next({ request: { headers: requestHeaders } });
      } else {
        // 서브도메인이 있지만 프로젝트를 찾지 못함 → 프로젝트 선택 페이지로
        logger.server(`[Middleware] 유효하지 않은 서브도메인: ${subdomain}`);
        const redirectUrl = new URL(`${protocol}//${mainDomain}/projects`);
        redirectUrl.searchParams.set("error", "invalid_subdomain");
        redirectUrl.searchParams.set("subdomain", subdomain);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // ============================================
  // 4. 인증 필수 + 서브도메인 선택적 경로 (/my-settings)
  //    - 비인증 시 로그인으로
  //    - 서브도메인 있어도/없어도 허용
  // ============================================
  if (matchesPath(pathname, AUTHENTICATED_OPTIONAL_SUBDOMAIN_PATHS)) {
    if (!hasAuthCookie) {
      if (subdomain) {
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // 서브도메인이 있으면 프로젝트 ID도 설정
    if (subdomain && accessToken) {
      const project = await fetchProjectBySubdomain(subdomain, accessToken, host);
      if (project) {
        const subdomainProjectId = String(project.id);
        const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;

        const currentAttendance = req.cookies.get("tg_use_attendance_menu")?.value;
        const nextAttendance =
          typeof project.useAttendanceMenu === "boolean" ? String(project.useAttendanceMenu) : null;
        const currentProjectType = req.cookies.get("tg_project_type")?.value;
        const nextProjectType = project.type || null;

        const shouldSetProjectId = !currentProjectId || currentProjectId !== subdomainProjectId;
        const shouldSetAttendance = nextAttendance !== null && currentAttendance !== nextAttendance;
        const shouldSetProjectType = nextProjectType !== null && currentProjectType !== nextProjectType;

        if (shouldSetProjectId || shouldSetAttendance || shouldSetProjectType) {
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          if (shouldSetProjectId) {
            setProjectIdCookie(response, req, subdomainProjectId);
          }
          if (shouldSetAttendance && nextAttendance !== null) {
            setAttendanceMenuCookie(response, req, nextAttendance === "true");
          }
          if (shouldSetProjectType && nextProjectType !== null) {
            setProjectTypeCookie(response, req, nextProjectType);
          }
          return response;
        }
      }
    }
    
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ============================================
  // 5. 인증 필수 + 소셜 회원가입 관련 경로 (/social-signup, /project-signup)
  //    - 비인증 시 로그인으로
  //    - 서브도메인 있으면 메인 도메인으로 리다이렉트
  // ============================================
  if (matchesPath(pathname, SOCIAL_SIGNUP_PATHS)) {
    // 비인증 시 로그인으로
    if (!hasAuthCookie) {
      if (subdomain) {
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // 서브도메인이 있으면 메인 도메인으로 리다이렉트
    if (subdomain) {
      logger.server(`[Middleware] 소셜 회원가입 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트: ${pathname}`);
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}${pathname}${req.nextUrl.search}`));
    }
    
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // 루트 경로 (서브도메인 처리용)
    '/',
    // 보호된 경로 (인증 + 프로젝트 필수)
    '/dashboard/:path*',
    '/consult/:path*',
    '/customers/:path*',
    '/stats/:path*',
    '/debt-relief/:path*',
    '/notices/:path*',
    '/attendance/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    // 프로젝트 선택 경로
    '/projects/:path*',
    // 인증만 필요한 경로
    '/my-settings/:path*',
    // 소셜 회원가입 관련 경로
    '/social-signup/:path*',
    '/project-signup/:path*',
    // 비회원 전용 경로 (서브도메인 체크용)
    '/login/:path*',
    '/signup/:path*',
    '/forgot-password/:path*',
    '/auth/callback/:path*',
  ],
};
