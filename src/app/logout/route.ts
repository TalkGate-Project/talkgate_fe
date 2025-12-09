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
 * 로그아웃 처리: 인증 쿠키를 삭제합니다.
 * 
 * 프로덕션 환경에서는 Domain 속성이 있는 쿠키와 없는 쿠키를 모두 삭제하여
 * 브라우저 호환성을 보장합니다.
 */
async function handleLogout(request: NextRequest) {
  const cookieStore = await cookies();
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = isProductionDomain(hostname);
  const isSecure = request.nextUrl.protocol === 'https:';

  // 프로덕션 환경에서는 Domain 속성이 있는 쿠키도 삭제
  if (isProduction) {
    const cookieOptionsWithDomain = {
      expires: new Date(0),
      path: '/',
      domain: '.talkgate.im',
      secure: isSecure,
      sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
      httpOnly: true,
    };
    
    cookieStore.set('tg_access_token', '', cookieOptionsWithDomain);
    cookieStore.set('tg_refresh_token', '', cookieOptionsWithDomain);
  }

  // Domain 속성이 없는 쿠키도 삭제 (브라우저 호환성)
  const cookieOptionsWithoutDomain = {
    expires: new Date(0),
    path: '/',
    domain: undefined as string | undefined,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    httpOnly: true,
  };
  
  cookieStore.set('tg_access_token', '', cookieOptionsWithoutDomain);
  cookieStore.set('tg_refresh_token', '', cookieOptionsWithoutDomain);
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

    console.log('[Logout] 🚪 로그아웃 요청:', {
      callbackUrl,
      returnUrl,
      host: request.headers.get('host'),
    });

    // 로그아웃 처리 (쿠키 삭제)
    await handleLogout(request);

    // 콜백 URL이 있으면 검증 후 리다이렉트
    if (callbackUrl) {
      if (!isValidCallbackUrl(callbackUrl)) {
        console.error('[Logout] ❌ 유효하지 않은 콜백 URL:', callbackUrl);
        // 콜백 URL이 유효하지 않은 경우 기본 홈으로 리다이렉트
        return NextResponse.redirect(new URL('/', request.url));
      }

      // 콜백 URL로 리다이렉트 (returnUrl과 success 파라미터 포함)
      const callback = new URL(callbackUrl);
      if (returnUrl) {
        callback.searchParams.set('returnUrl', returnUrl);
      }
      callback.searchParams.set('success', 'true');

      console.log('[Logout] ✅ 로그아웃 완료 - 콜백 URL로 리다이렉트:', callback.toString());
      return NextResponse.redirect(callback);
    }

    // 콜백 URL이 없는 경우 기본 로그아웃 처리 (홈으로 리다이렉트)
    console.log('[Logout] ✅ 로그아웃 완료 - 홈으로 리다이렉트');
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('[Logout] ❌ 로그아웃 처리 중 에러:', error);
    // 에러 발생 시에도 홈으로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url));
  }
}

