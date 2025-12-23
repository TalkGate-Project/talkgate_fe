import { NextRequest, NextResponse } from 'next/server';
import { deleteAuthCookies } from '@/lib/cookies';

/**
 * 로그아웃 Route Handler
 * 
 * GET /logout?redirect={url}
 * 
 * 서버에서 직접 쿠키를 삭제하고 리다이렉트합니다.
 * 클라이언트 사이드 fetch() 후 리다이렉트 시 Set-Cookie 헤더가 
 * 적용되지 않는 문제를 방지하기 위해 Route Handler를 사용합니다.
 */
export async function GET(request: NextRequest) {
  console.log('[Logout Route] 🚪 로그아웃 요청 수신');

  // 리다이렉트 URL 결정
  const redirectParam = request.nextUrl.searchParams.get('redirect');
  const host = request.headers.get('host') || 'localhost:3000';
  const hostWithoutPort = host.split(':')[0];
  const protocol = request.nextUrl.protocol || 'https:';
  
  let mainDomain = host;
  
  // 메인 도메인 계산
  if (hostWithoutPort.includes('.talkgate.im')) {
    if (hostWithoutPort.includes('app.talkgate.im') && !hostWithoutPort.includes('app-dev')) {
      mainDomain = 'app.talkgate.im';
    } else {
      mainDomain = 'app-dev.talkgate.im';
    }
  }
  
  // 절대 URL 생성 (NextResponse.redirect는 절대 URL만 허용)
  let finalUrl: string;
  if (redirectParam) {
    // 상대 URL인 경우 절대 URL로 변환
    if (redirectParam.startsWith('/')) {
      finalUrl = `${protocol}//${host}${redirectParam}`;
    } else if (redirectParam.startsWith('http://') || redirectParam.startsWith('https://')) {
      finalUrl = redirectParam;
    } else {
      finalUrl = `${protocol}//${host}/${redirectParam}`;
    }
  } else {
    finalUrl = `${protocol}//${mainDomain}/login?logout=success`;
  }

  console.log('[Logout Route] 🔄 리다이렉트 URL:', finalUrl);

  // 리다이렉트 응답 생성
  const response = NextResponse.redirect(finalUrl);

  // 모든 인증 쿠키 삭제
  deleteAuthCookies(response, request);

  console.log('[Logout Route] ✅ 쿠키 삭제 완료, 리다이렉트 중...');

  return response;
}

