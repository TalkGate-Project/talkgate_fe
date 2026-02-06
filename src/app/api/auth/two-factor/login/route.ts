import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, setProjectIdCookie } from '@/lib/cookies';
import { logger } from '@/lib/logger';
import { decryptToken } from '@/lib/crypto';

/**
 * 2FA 로그인 API 엔드포인트
 * 
 * 서버에서 쿠키를 httpOnly로 설정하여 보안을 강화합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 클라이언트에서 totpCode로 보내거나 code로 보내는 경우 모두 처리
    const { twoFactorToken, totpCode, code } = body;
    // code가 오면 totpCode로 변환 (하위 호환성)
    const finalTotpCode = totpCode || code;

    if (!twoFactorToken || !finalTotpCode) {
      return NextResponse.json(
        { message: 'twoFactorToken과 totpCode가 필요합니다.' },
        { status: 400 }
      );
    }

    // 암호화된 토큰을 복호화하여 원본 JWT 복원
    let decryptedToken: string;
    try {
      decryptedToken = decryptToken(twoFactorToken);
    } catch {
      return NextResponse.json(
        { message: '유효하지 않은 인증 토큰입니다.' },
        { status: 400 }
      );
    }

    // API 서버로 2FA 로그인 요청 전달
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (
      process.env.NODE_ENV === "production"
        ? "https://api.talkgate.im"
        : "https://api-dev.talkgate.im"
    );
    const apiUrl = `${apiBaseUrl}/v1/auth/two-factor/login`;
    
    // 백엔드는 { twoFactorToken, totpCode } 형식을 기대함 (code가 아니라 totpCode!)
    // 복호화된 원본 JWT를 백엔드에 전달
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        twoFactorToken: decryptedToken, 
        totpCode: finalTotpCode, // 백엔드는 totpCode를 기대함
      }),
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { message: '백엔드 응답 파싱 실패' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // 2FA 로그인 성공 시 토큰 추출
    const loginData = data?.data || data;
    const accessToken = loginData?.accessToken;
    const refreshToken = loginData?.refreshToken;

    // 토큰이 없으면 에러
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { message: '토큰이 반환되지 않았습니다.' },
        { status: 500 }
      );
    }

    const responseData = {
      user: loginData?.user,
      projectId: loginData?.projectId || loginData?.defaultProjectId || loginData?.user?.defaultProjectId,
    };
    
    const nextResponse = NextResponse.json(responseData);
    
    // ✅ 새로운 쿠키 유틸리티 사용
    if (accessToken && refreshToken) {
      setAuthCookies(nextResponse, request, {
        accessToken,
        refreshToken,
        maxAge: 60 * 60 * 24 * 30, // 30일
      });
    }
    
    // 프로젝트 ID 쿠키 설정
    if (responseData.projectId) {
      setProjectIdCookie(nextResponse, request, responseData.projectId);
    }
    
    return nextResponse;
  } catch (error) {
    logger.serverError('[2FA Login API] 에러:', error);
    return NextResponse.json(
      { message: '2FA 로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

