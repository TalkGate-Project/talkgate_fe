import { NextRequest, NextResponse } from 'next/server';

/**
 * 쿠키 옵션 타입
 */
export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'none' | 'lax' | 'strict';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
};

/**
 * 현재 환경에 맞는 쿠키 옵션을 생성합니다.
 * 서브도메인 간 쿠키 공유를 위해 domain: '.talkgate.im'을 사용합니다.
 */
export function getCookieOptions(request: NextRequest): CookieOptions {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
  const isSecure = request.nextUrl.protocol === 'https:';
  
  // 프로덕션 HTTPS 환경에서는 secure: true, 그 외는 false
  const shouldUseSecure = process.env.NODE_ENV === 'production' && isSecure;

  return {
    path: '/',
    httpOnly: false, // 테스트를 위해 false (프로덕션에서는 true로 변경 필요)
    secure: shouldUseSecure,
    sameSite: (shouldUseSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    ...(isProduction && { domain: '.talkgate.im' }),
  };
}

/**
 * 인증 토큰 쿠키를 설정합니다.
 */
export function setAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    maxAge?: number;
  }
): void {
  const cookieOptions = getCookieOptions(request);
  const maxAge = tokens.maxAge || 60 * 60 * 24 * 30; // 기본 30일

  response.cookies.set('tg_access_token', tokens.accessToken, {
    ...cookieOptions,
    maxAge,
  });

  if (tokens.refreshToken) {
    response.cookies.set('tg_refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge,
    });
  }
}

/**
 * 프로젝트 ID 쿠키를 설정합니다.
 */
export function setProjectIdCookie(
  response: NextResponse,
  request: NextRequest,
  projectId: string | number
): void {
  const cookieOptions = getCookieOptions(request);
  
  response.cookies.set('tg_selected_project_id', String(projectId), {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

/**
 * 모든 인증 관련 쿠키를 삭제합니다.
 * 서브도메인과 메인 도메인 모두에서 삭제를 시도합니다.
 * 
 * 중요: 쿠키 삭제는 설정할 때 사용한 것과 정확히 동일한 속성을 사용해야 합니다.
 * 실제 쿠키 설정과 동일한 옵션만 사용하여 정확하게 삭제합니다.
 */
export function deleteAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
  const isSecure = request.nextUrl.protocol === 'https:';
  const shouldUseSecure = process.env.NODE_ENV === 'production' && isSecure;

  const cookiesToDelete = [
    'tg_access_token',
    'tg_refresh_token',
    'tg_selected_project_id',
  ];

  // 정확한 쿠키 옵션으로 삭제 (설정할 때와 동일한 옵션 사용)
  const deleteOptions: CookieOptions = {
    path: '/',
    httpOnly: false,
    secure: shouldUseSecure,
    sameSite: (shouldUseSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    maxAge: 0,
    expires: new Date(0),
  };

  cookiesToDelete.forEach(cookieName => {
    // 1. 프로덕션 환경: .talkgate.im 도메인 쿠키 삭제 (설정할 때와 동일한 옵션)
    if (isProduction) {
      response.cookies.set(cookieName, '', {
        ...deleteOptions,
        domain: '.talkgate.im',
      });
    }

    // 2. 현재 도메인 쿠키 삭제 (HostOnly 쿠키가 있을 수 있으므로)
    // domain을 명시하지 않으면 현재 호스트 기준으로 삭제됨
    response.cookies.set(cookieName, '', deleteOptions);
  });

  console.log('[Cookie Utils] 🍪 쿠키 삭제 헤더 추가 완료:', {
    cookiesToDelete,
    isProduction,
    shouldUseSecure,
    hostname,
    deleteOptions,
  });
}

