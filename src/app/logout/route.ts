import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 콜백 URL이 허용된 도메인인지 검증합니다.
 * 
 * 랜딩 페이지 도메인:
 * - https://talkgate.im (프로덕션 랜딩 페이지)
 * - https://landing.talkgate.im (기존 호환성 유지)
 * 
 * 개발 환경:
 * - http://localhost:3000
 * - http://127.0.0.1:3000
 */
function isValidCallbackUrl(url: string): boolean {
  try {
    const callbackUrl = new URL(url);
    const allowedDomains = [
      'https://talkgate.im', // 프로덕션 랜딩 페이지
      'https://landing.talkgate.im', // 기존 호환성 유지
      'http://localhost:3000', // 개발 환경
      'http://127.0.0.1:3000', // 개발 환경
    ];
    
    return allowedDomains.some(domain => {
      const allowedUrl = new URL(domain);
      return callbackUrl.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
}

/**
 * 현재 호스트가 프로덕션 도메인인지 확인합니다.
 */
function isProductionDomain(hostname: string): boolean {
  return hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
}

/**
 * 현재 환경에 맞는 메인 도메인을 반환합니다.
 * 미들웨어와 동일한 로직 사용
 */
function getMainDomain(host: string): string {
  const hostWithoutPort = host.split(':')[0];
  
  // localhost 환경
  if (hostWithoutPort.includes("localhost") || hostWithoutPort.includes("127.0.0.1")) {
    return host; // 포트 포함하여 반환
  }
  
  // 프로덕션 환경 (app.talkgate.im)
  if (hostWithoutPort.includes("app.talkgate.im") && !hostWithoutPort.includes("app-dev")) {
    return "app.talkgate.im";
  }
  
  // 개발 환경 (app-dev.talkgate.im) - 서브도메인 포함
  // 예: project-bdfj4.app-dev.talkgate.im → app-dev.talkgate.im
  if (hostWithoutPort.includes("app-dev") || hostWithoutPort.includes("talkgate.im")) {
    return "app-dev.talkgate.im";
  }
  
  // 기본값
  return hostWithoutPort;
}

/**
 * 로그아웃 처리: 인증 쿠키를 삭제합니다.
 * 
 * 프로덕션 환경에서는 Domain 속성이 있는 쿠키와 없는 쿠키를 모두 삭제하여
 * 브라우저 호환성을 보장합니다.
 * 
 * 중요: httpOnly 쿠키는 서버에서만 삭제할 수 있습니다.
 */
/**
 * 쿠키 삭제 헤더를 응답에 추가합니다.
 * 쿠키 삭제는 쿠키가 설정된 것과 정확히 동일한 속성을 사용해야 합니다.
 */
function addCookieDeletionHeaders(
  response: NextResponse,
  request: NextRequest
): void {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = isProductionDomain(hostname);
  const isSecure = request.nextUrl.protocol === 'https:';

  // 삭제할 쿠키 목록
  const cookiesToDelete = [
    'tg_access_token',
    'tg_refresh_token',
    'tg_selected_project_id', // 프로젝트 ID 쿠키도 삭제
  ];

  // 로그인 API와 동일한 방식으로 쿠키 삭제
  // 로그인 API: domain: '.talkgate.im' (프로덕션), maxAge 사용
  const baseCookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    path: '/',
    maxAge: 0, // 즉시 만료
  };

  // 프로덕션 환경: Domain 속성이 있는 쿠키 삭제
  // 로그인 시 domain: '.talkgate.im'으로 설정했으므로 동일하게 삭제
  if (isProduction) {
    const cookieOptionsWithDomain = {
      ...baseCookieOptions,
      domain: '.talkgate.im',
    };
    
    cookiesToDelete.forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptionsWithDomain);
      console.log(`[Logout Route] 🍪 쿠키 삭제 헤더 추가 (도메인 포함): ${cookieName}`, cookieOptionsWithDomain);
    });
  }

  // Domain 속성이 없는 쿠키도 삭제 시도 (브라우저 호환성)
  // 현재 도메인에 설정된 쿠키 삭제
  // domain을 명시하지 않음 (현재 도메인에 자동 설정)
  cookiesToDelete.forEach(cookieName => {
    response.cookies.set(cookieName, '', baseCookieOptions);
    console.log(`[Logout Route] 🍪 쿠키 삭제 헤더 추가 (도메인 없음): ${cookieName}`, baseCookieOptions);
  });
  
  // Set-Cookie 헤더 확인
  const setCookieHeaders = response.headers.getSetCookie();
  console.log('[Logout Route] 📋 Set-Cookie 헤더 확인:', setCookieHeaders);
}

/**
 * 로그아웃 엔드포인트
 * 
 * 랜딩 페이지에서 로그아웃 요청 시:
 * 1. 쿼리 파라미터로 callbackUrl과 returnUrl을 받습니다
 * 2. 인증 쿠키를 삭제합니다
 * 3. 콜백 URL로 리다이렉트합니다 (returnUrl과 success 파라미터 포함)
 * 
 * 요청 예시:
 * GET /logout?callbackUrl=https://talkgate.im/api/auth/logout-callback&returnUrl=https://talkgate.im/pricing
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const callbackUrl = searchParams.get('callbackUrl');
    const returnUrl = searchParams.get('returnUrl');

    console.log('[Logout Route] 🚪 로그아웃 요청 시작:', {
      callbackUrl,
      returnUrl,
      host: request.headers.get('host'),
      protocol: request.nextUrl.protocol,
      pathname: request.nextUrl.pathname,
    });

    console.log('[Logout Route] 🍪 쿠키 삭제 시작');

    // 콜백 URL이 있으면 검증 후 리다이렉트
    if (callbackUrl) {
      if (!isValidCallbackUrl(callbackUrl)) {
        console.error('[Logout Route] ❌ 유효하지 않은 콜백 URL:', callbackUrl);
        // 콜백 URL이 유효하지 않은 경우 쿠키 삭제 후 메인 도메인 로그인으로 리다이렉트
        const currentHost = request.headers.get('host') || '';
        const protocol = request.nextUrl.protocol;
        const mainDomain = getMainDomain(currentHost);
        const loginUrl = `${protocol}//${mainDomain}/login`;
        
        // 쿠키 삭제 헤더를 포함한 리다이렉트 응답
        const redirectResponse = NextResponse.redirect(new URL(loginUrl));
        addCookieDeletionHeaders(redirectResponse, request);
        return redirectResponse;
      }

      // 콜백 URL로 리다이렉트 (returnUrl과 success 파라미터 포함)
      const callback = new URL(callbackUrl);
      if (returnUrl) {
        callback.searchParams.set('returnUrl', returnUrl);
      }
      callback.searchParams.set('success', 'true');

      console.log('[Logout Route] ✅ 로그아웃 완료 - 콜백 URL로 리다이렉트:', callback.toString());
      
      // 쿠키 삭제 헤더를 포함한 리다이렉트 응답
      const redirectResponse = NextResponse.redirect(callback);
      addCookieDeletionHeaders(redirectResponse, request);
      return redirectResponse;
    }

    // 콜백 URL이 없는 경우 기본 로그아웃 처리
    // 서브도메인에서 로그아웃 시 메인 도메인의 로그인 페이지로 리다이렉트
    const currentHost = request.headers.get('host') || '';
    const protocol = request.nextUrl.protocol;
    const mainDomain = getMainDomain(currentHost);
    
    const loginUrlObj = new URL(`${protocol}//${mainDomain}/login`);
    // 로그아웃 완료 플래그 추가 - 로그인 페이지에서 쿠키 체크를 건너뛰도록 함
    loginUrlObj.searchParams.set('logout', 'success');
    
    console.log('[Logout Route] ✅ 로그아웃 완료 - 로그인 페이지로 리다이렉트:', {
      from: currentHost,
      to: loginUrlObj.toString(),
      mainDomain,
    });
    
    // 쿠키 삭제 헤더를 포함한 리다이렉트 응답
    const redirectResponse = NextResponse.redirect(loginUrlObj);
    addCookieDeletionHeaders(redirectResponse, request);
    return redirectResponse;
  } catch (error) {
    console.error('[Logout Route] ❌ 로그아웃 처리 중 에러:', error);
    console.error('[Logout Route] ❌ 에러 스택:', error instanceof Error ? error.stack : 'No stack');
    // 에러 발생 시에도 메인 도메인의 로그인 페이지로 리다이렉트 (쿠키 삭제 시도)
    const currentHost = request.headers.get('host') || '';
    const protocol = request.nextUrl.protocol;
    const mainDomain = getMainDomain(currentHost);
    const loginUrlObj = new URL(`${protocol}//${mainDomain}/login`);
    loginUrlObj.searchParams.set('logout', 'success');
    const redirectResponse = NextResponse.redirect(loginUrlObj);
    addCookieDeletionHeaders(redirectResponse, request);
    return redirectResponse;
  }
}

