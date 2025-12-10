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
/**
 * 쿠키 삭제 헤더를 응답에 추가합니다.
 * 
 * 중요: 로그인 API와 동일한 방식으로 쿠키를 삭제해야 합니다.
 * 
 * Next.js 15에서는 두 가지 방법을 모두 사용하여 확실히 삭제:
 * 1. cookies().delete() - 서버 사이드에서 직접 삭제
 * 2. NextResponse.cookies.set() - 응답 헤더에 Set-Cookie 추가
 * 
 * 로그인 API에서 사용한 옵션:
 * - httpOnly: true
 * - secure: isSecure (프로토콜이 https인지 확인)
 * - sameSite: isSecure ? 'none' : 'lax'
 * - path: '/'
 * - domain: 프로덕션 환경에서 '.talkgate.im'
 * 
 * 쿠키 삭제 시 주의사항:
 * 1. 설정할 때 사용한 것과 정확히 동일한 속성을 사용해야 함
 * 2. domain, path, secure, sameSite가 일치해야 브라우저가 쿠키를 삭제함
 * 3. maxAge: 0 또는 expires: 과거 날짜로 설정하여 삭제
 */
async function addCookieDeletionHeaders(
  response: NextResponse,
  request: NextRequest
): Promise<void> {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = isProductionDomain(hostname);
  const isSecure = request.nextUrl.protocol === 'https:';

  // 디버깅: 환경 정보 로깅
  console.log('[Logout Route] 🔍 쿠키 삭제 환경 정보:', {
    hostname,
    isProduction,
    isSecure,
    protocol: request.nextUrl.protocol,
    url: request.nextUrl.toString(),
  });

  // 삭제할 쿠키 목록
  const cookiesToDelete = [
    'tg_access_token',
    'tg_refresh_token',
    'tg_selected_project_id', // 프로젝트 ID 쿠키도 삭제
  ];

  // ✅ NextResponse.cookies.set()만 사용하여 쿠키 삭제
  // cookies().delete()와 NextResponse.cookies.set() 혼용 시 타이밍 이슈로 인해 의도한 대로 동작하지 않을 수 있음
  // 특히 middleware를 거쳐온 응답 객체라면 더욱 그렇습니다.
  // 로그인 API와 정확히 동일한 옵션 사용
  // 프로덕션 HTTPS 환경에서는 secure: true, 그 외는 false
  const shouldUseSecure = process.env.NODE_ENV === 'production' && isSecure;
  
  const baseCookieOptions = {
    // 테스트를 위해 httpOnly: false로 설정 (로그인 API와 일치)
    httpOnly: false,
    secure: shouldUseSecure, // 프로덕션 HTTPS 환경에서는 true, 그 외는 false
    sameSite: (shouldUseSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    path: '/',
    maxAge: 0, // 즉시 만료 (쿠키 삭제)
    expires: new Date(0), // 과거 날짜로 설정 (추가 보장)
  };
  
  console.log('[Logout Route] 🔍 쿠키 삭제 옵션:', {
    baseCookieOptions,
    isProduction,
    isSecure,
  });

  // 중요: 서브도메인에서 쿠키 삭제 시
  // 1. 현재 도메인의 쿠키 삭제
  // 2. .talkgate.im 도메인 쿠키 삭제 (프로덕션 환경)
  // 3. 메인 도메인으로 리다이렉트하여 확실히 삭제
  
  // 쿠키 삭제: 모든 가능한 조합으로 삭제 시도
  cookiesToDelete.forEach(cookieName => {
    // 1. 프로덕션 환경: Domain 속성이 있는 쿠키 삭제 (.talkgate.im)
    // 로그인 시 domain: '.talkgate.im'으로 설정했으므로 동일하게 삭제
    if (isProduction) {
      response.cookies.set(cookieName, '', {
        ...baseCookieOptions,
        domain: '.talkgate.im',
      });
      console.log(`[Logout Route] 🍪 쿠키 삭제 헤더 추가 (.talkgate.im 도메인): ${cookieName}`);
    }
    
    // 2. 현재 도메인에 설정된 쿠키 삭제 시도 (HostOnly 쿠키 포함)
    // domain 속성을 명시하지 않으면 현재 호스트 기준으로 삭제됨
    response.cookies.set(cookieName, '', {
      ...baseCookieOptions,
      // domain을 명시하지 않음 (현재 도메인에 자동 설정)
    });
    console.log(`[Logout Route] 🍪 쿠키 삭제 헤더 추가 (현재 도메인): ${cookieName}`);
  });
  
  // Set-Cookie 헤더 확인
  const setCookieHeaders = response.headers.getSetCookie();
  console.log('[Logout Route] 📋 Set-Cookie 헤더 확인 (총 개수):', setCookieHeaders.length);
  setCookieHeaders.forEach((header, index) => {
    console.log(`[Logout Route] 📋 Set-Cookie 헤더 [${index}]:`, header);
  });
  
  // 토큰 쿠키만 필터링하여 확인
  const tokenCookieHeaders = setCookieHeaders.filter(header => 
    header.includes('tg_access_token') || header.includes('tg_refresh_token')
  );
  console.log('[Logout Route] 🎯 토큰 쿠키 삭제 헤더:', tokenCookieHeaders);
  
  if (tokenCookieHeaders.length === 0) {
    console.error('[Logout Route] ❌ 토큰 쿠키 삭제 헤더가 없습니다!');
  }
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
    const redirect = searchParams.get('redirect'); // Header에서 전달하는 redirect 파라미터

    const currentHost = request.headers.get('host') || '';
    const protocol = request.nextUrl.protocol;
    const mainDomain = getMainDomain(currentHost);

    console.log('[Logout Route] 🚪 로그아웃 요청 시작:', {
      callbackUrl,
      returnUrl,
      redirect,
      currentHost,
      mainDomain,
      protocol: request.nextUrl.protocol,
      pathname: request.nextUrl.pathname,
    });

    // 서브도메인에서 호출된 경우 메인 도메인으로 리다이렉트
    // .talkgate.im 도메인 쿠키는 메인 도메인에서만 삭제 가능
    const hostWithoutPort = currentHost.split(':')[0];
    // 메인 도메인 목록
    const MAIN_DOMAINS = ["talkgate.im", "localhost", "127.0.0.1"];
    const RESERVED_SUBDOMAINS = ["www", "app", "app-dev", "api", "api-dev", "landing", "landing-dev", "dev", "staging", "admin"];
    
    // 서브도메인인지 확인
    let isSubdomain = false;
    for (const mainDomain of MAIN_DOMAINS) {
      if (hostWithoutPort === mainDomain) {
        isSubdomain = false;
        break;
      }
      if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
        const subdomain = hostWithoutPort.slice(0, -(mainDomain.length + 1));
        const firstPart = subdomain.split(".")[0];
        if (firstPart && !RESERVED_SUBDOMAINS.includes(firstPart.toLowerCase())) {
          isSubdomain = true;
          break;
        }
      }
    }
    
    if (isSubdomain) {
      console.log('[Logout Route] 🔄 서브도메인에서 호출됨 - 쿠키 정리 후 메인 도메인 이동');
      
      // 메인 도메인의 /logout으로 리다이렉트 (쿼리 파라미터 유지)
      const logoutUrl = new URL(`${protocol}//${mainDomain}/logout`);
      searchParams.forEach((value, key) => {
        logoutUrl.searchParams.set(key, value);
      });
      
      // 리다이렉트 응답 생성
      const redirectResponse = NextResponse.redirect(logoutUrl);
      
      // ✨ 핵심: 현재 서브도메인에 묻어있을 수 있는 HostOnly 쿠키들을 삭제
      const cookiesToDelete = ['tg_access_token', 'tg_refresh_token', 'tg_selected_project_id'];
      const isProduction = isProductionDomain(hostWithoutPort);
      const isSecure = request.nextUrl.protocol === 'https:';
      const shouldUseSecure = process.env.NODE_ENV === 'production' && isSecure;
      
      cookiesToDelete.forEach(cookieName => {
        // 1. HostOnly 쿠키 삭제 (domain 속성 없음 - 현재 서브도메인 전용 쿠키)
        redirectResponse.cookies.set(cookieName, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
          sameSite: (shouldUseSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
          secure: shouldUseSecure, // 프로덕션 HTTPS 환경에서는 true, 그 외는 false
          httpOnly: false,
        });
        
        // 2. .talkgate.im 도메인 쿠키도 삭제 시도 (서브도메인에서도 상위 도메인 쿠키 삭제 가능)
        if (isProduction) {
          redirectResponse.cookies.set(cookieName, '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
            domain: '.talkgate.im',
            sameSite: (shouldUseSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
            secure: shouldUseSecure, // 프로덕션 HTTPS 환경에서는 true, 그 외는 false
            httpOnly: false,
          });
        }
      });
      
      console.log('[Logout Route] 🍪 서브도메인 쿠키 삭제 헤더 추가 후 메인 도메인으로 리다이렉트');
      return redirectResponse;
    }

    console.log('[Logout Route] 🍪 쿠키 삭제 시작 (메인 도메인에서 실행)');

    // 콜백 URL이 있으면 검증 후 리다이렉트
    if (callbackUrl) {
      if (!isValidCallbackUrl(callbackUrl)) {
        console.error('[Logout Route] ❌ 유효하지 않은 콜백 URL:', callbackUrl);
        // 콜백 URL이 유효하지 않은 경우 쿠키 삭제 후 메인 도메인 로그인으로 리다이렉트
        const loginUrl = `${protocol}//${mainDomain}/login`;
        
        // 쿠키 삭제 헤더를 포함한 리다이렉트 응답
        const redirectResponse = NextResponse.redirect(new URL(loginUrl));
        await addCookieDeletionHeaders(redirectResponse, request);
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
      await addCookieDeletionHeaders(redirectResponse, request);
      return redirectResponse;
    }

    // 콜백 URL이 없는 경우 기본 로그아웃 처리
    // redirect 파라미터가 있으면 해당 URL로, 없으면 메인 도메인의 로그인 페이지로 리다이렉트
    let loginUrlObj: URL;
    if (redirect) {
      // redirect 파라미터가 있으면 해당 URL 사용
      try {
        loginUrlObj = new URL(redirect);
      } catch {
        // 유효하지 않은 URL인 경우 기본 로그인 페이지 사용
        loginUrlObj = new URL(`${protocol}//${mainDomain}/login`);
        loginUrlObj.searchParams.set('logout', 'success');
      }
    } else {
      // redirect 파라미터가 없으면 메인 도메인의 로그인 페이지로 리다이렉트
      loginUrlObj = new URL(`${protocol}//${mainDomain}/login`);
      // 로그아웃 완료 플래그 추가 - 로그인 페이지에서 쿠키 체크를 건너뛰도록 함
      loginUrlObj.searchParams.set('logout', 'success');
    }
    
    console.log('[Logout Route] ✅ 로그아웃 완료 - 로그인 페이지로 리다이렉트:', {
      from: currentHost,
      to: loginUrlObj.toString(),
      mainDomain,
      hasRedirect: !!redirect,
    });
    
    // 쿠키 삭제 헤더를 포함한 리다이렉트 응답
    const redirectResponse = NextResponse.redirect(loginUrlObj);
    await addCookieDeletionHeaders(redirectResponse, request);
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
    await addCookieDeletionHeaders(redirectResponse, request);
    return redirectResponse;
  }
}

