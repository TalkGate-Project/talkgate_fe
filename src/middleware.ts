import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { setProjectIdCookie, setAttendanceMenuCookie, getCookieOptions, deleteAuthCookies } from "@/lib/cookies";

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
  "/attendance",
  "/notices",
  "/settings",
  "/notifications",
];

// 인증 필수 + 프로젝트 선택 경로 (서브도메인 불가)
const PROJECT_SELECTION_PATHS = [
  "/projects",
];

// 인증 필수 + 서브도메인 선택적 경로
const AUTHENTICATED_OPTIONAL_SUBDOMAIN_PATHS = [
  "/my-settings",
];

// 인증 필수 + 소셜 회원가입 관련 경로 (서브도메인 불필요)
const SOCIAL_SIGNUP_PATHS = [
  "/social-signup",
  "/project-signup",
];

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

/**
 * 경로가 특정 패턴에 해당하는지 확인합니다.
 */
function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * User-Agent를 분석하여 모바일 기기인지 확인합니다.
 */
function isMobileDevice(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  // 일반적인 모바일 기기 패턴
  const mobilePatterns = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Opera Mini/i,
    /IEMobile/i,
    /Mobile/i,
    /mobile/i,
    /Tablet/i,
    /SamsungBrowser/i,  // 삼성 인터넷 브라우저 (데스크톱 모드에서도 감지)
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent");
  const accessToken = req.cookies.get("tg_access_token")?.value;
  const hasAuthCookie = Boolean(accessToken);
  const protocol = req.nextUrl.protocol;

  // UI Zoom 설정을 위한 헤더 처리
  // 기본값은 compact (0.8)
  let uiZoomMode = "compact";
  
  // 1. 모바일 기기는 무조건 normal (1.0) - 서버사이드에서 User-Agent로 감지
  const isMobile = isMobileDevice(userAgent);
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

  // 개발 환경에서는 서브도메인 로직 건너뜀
  if (isDev) {
    // 미인증 사용자가 보호 경로 접근 시 로그인으로 리다이렉트
    if (!hasAuthCookie) {
      const isProtectedPath = matchesPath(pathname, [
        ...AUTHENTICATED_PROJECT_PATHS,
        ...PROJECT_SELECTION_PATHS,
        ...AUTHENTICATED_OPTIONAL_SUBDOMAIN_PATHS,
      ]);
      
      if (isProtectedPath) {
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
  const subdomain = extractSubdomain(host);
  const mainDomain = getMainDomain(host);

  if (pathname === "/") {
    // 서브도메인이 있는 경우 (프로젝트 컨텍스트)
    if (subdomain) {
      if (hasAuthCookie && accessToken) {
        // 인증됨 + 서브도메인 → 프로젝트 확인 후 대시보드로 리다이렉트
        const project = await fetchProjectBySubdomain(subdomain, accessToken, host);
        
        if (project) {
          console.log(`[Middleware] 루트 + 서브도메인 + 인증됨 → /dashboard로 리다이렉트`);
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
          return response;
        } else {
          // 유효하지 않은 서브도메인 → 프로젝트 선택 페이지로
          console.log(`[Middleware] 루트 + 유효하지 않은 서브도메인: ${subdomain}`);
          const redirectUrl = new URL(`${protocol}//${mainDomain}/projects`);
          redirectUrl.searchParams.set("error", "invalid_subdomain");
          redirectUrl.searchParams.set("subdomain", subdomain);
          return NextResponse.redirect(redirectUrl);
        }
      } else {
        // 비인증 + 서브도메인 → 메인 도메인 로그인으로 리다이렉트
        console.log(`[Middleware] 루트 + 서브도메인 + 비인증 → 메인도메인 로그인으로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
    } else {
      // 서브도메인이 없는 경우 (메인 도메인)
      if (hasAuthCookie) {
        // 인증됨 + 메인 도메인 → 프로젝트 선택으로 리다이렉트
        console.log(`[Middleware] 루트 + 메인도메인 + 인증됨 → /projects로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/projects`));
      } else {
        // 비인증 + 메인 도메인 → 로그인으로 리다이렉트
        console.log(`[Middleware] 루트 + 메인도메인 + 비인증 → /login으로 리다이렉트`);
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
      console.log(`[Middleware] 비회원 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트: ${pathname}`);
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
      console.log(`[Middleware] 프로젝트 경로 + 비인증 → 로그인으로 리다이렉트`);
      return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
    }
    
    // 서브도메인이 있으면 메인 도메인으로
    if (subdomain) {
      console.log(`[Middleware] 프로젝트 선택 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트`);
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
        console.log(`[Middleware] 보호 경로 + 서브도메인 + 비인증 → 메인도메인 로그인으로 리다이렉트`);
        return NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      }
      console.log(`[Middleware] 보호 경로 + 비인증 → 로그인으로 리다이렉트`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 인증됨 + 서브도메인 없음 → 쿠키 청소 후 로그인으로 리다이렉트
    if (!subdomain) {
      console.log(`[Middleware] 인증된 보호경로 + 서브도메인 없음 → 쿠키 청소 후 로그인으로 리다이렉트`);
      const response = NextResponse.redirect(new URL(`${protocol}//${mainDomain}/login`));
      deleteAuthCookies(response, req);
      return response;
    }

    // 인증됨 + 서브도메인 있음 → 프로젝트 정보 확인
    if (subdomain && accessToken) {
      const project = await fetchProjectBySubdomain(subdomain, accessToken, host);
      
      if (project) {
        const subdomainProjectId = String(project.id);
        const currentProjectId = req.cookies.get("tg_selected_project_id")?.value;

        const currentAttendance = req.cookies.get("tg_use_attendance_menu")?.value;
        const nextAttendance =
          typeof project.useAttendanceMenu === "boolean" ? String(project.useAttendanceMenu) : null;

        const shouldSetProjectId = !currentProjectId || currentProjectId !== subdomainProjectId;
        const shouldSetAttendance = nextAttendance !== null && currentAttendance !== nextAttendance;

        if (shouldSetProjectId || shouldSetAttendance) {
          if (shouldSetProjectId) {
            console.log(`[Middleware] 프로젝트 ID 설정: ${subdomainProjectId}`);
          }
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          if (shouldSetProjectId) {
            setProjectIdCookie(response, req, subdomainProjectId);
          }
          if (shouldSetAttendance && nextAttendance !== null) {
            setAttendanceMenuCookie(response, req, nextAttendance === "true");
          }
          return response;
        }

        return NextResponse.next({ request: { headers: requestHeaders } });
      } else {
        // 서브도메인이 있지만 프로젝트를 찾지 못함 → 프로젝트 선택 페이지로
        console.log(`[Middleware] 유효하지 않은 서브도메인: ${subdomain}`);
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

        const shouldSetProjectId = !currentProjectId || currentProjectId !== subdomainProjectId;
        const shouldSetAttendance = nextAttendance !== null && currentAttendance !== nextAttendance;

        if (shouldSetProjectId || shouldSetAttendance) {
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          if (shouldSetProjectId) {
            setProjectIdCookie(response, req, subdomainProjectId);
          }
          if (shouldSetAttendance && nextAttendance !== null) {
            setAttendanceMenuCookie(response, req, nextAttendance === "true");
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
      console.log(`[Middleware] 소셜 회원가입 경로 + 서브도메인 존재 → 메인도메인으로 리다이렉트: ${pathname}`);
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
