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
  const protocol = request.nextUrl.protocol || 'https:';
  
  // 메인 도메인 계산
  // NEXT_PUBLIC_SITE_URL에서 추출 (host 기반 판단 제거)
  // 환경변수를 참조하지 못한 경우 app-dev.talkgate.im으로 폴백
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let mainDomain = "app-dev.talkgate.im";
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      const port = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";
      mainDomain = `${url.hostname}${port}`;
    } catch {
      // URL 파싱 실패 시 문자열에서 프로토콜만 제거
      mainDomain = siteUrl.replace(/^https?:\/\//, "").split("/")[0];
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

