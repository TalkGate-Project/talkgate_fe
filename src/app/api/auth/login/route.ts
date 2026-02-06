import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, setProjectIdCookie } from '@/lib/cookies';
import { logger } from '@/lib/logger';

/**
 * 로그인 API 엔드포인트
 * 
 * 서버에서 쿠키를 httpOnly로 설정하여 보안을 강화합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // API 서버로 로그인 요청 전달
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (
      process.env.NODE_ENV === "production"
        ? "https://api.talkgate.im"
        : "https://api-dev.talkgate.im"
    );
    const response = await fetch(`${apiBaseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // 백엔드가 HTTP 200으로 내려주더라도, 비즈니스 실패(result:false)는 실패로 취급해
    // 프론트에서 일관되게 에러 플로우(모달/피드백)로 처리할 수 있게 합니다.
    // 예: { result:false, code:"UNAUTHORIZED", message:"Invalid email or password", traceId }
    if (data?.result === false) {
      const code = String(data?.code || "").toUpperCase();
      const fallbackStatus =
        code === "UNAUTHORIZED" || code.includes("UNAUTHORIZED") ? 401 : 400;
      return NextResponse.json(data, {
        status: response.status >= 400 ? response.status : fallbackStatus,
      });
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // 로그인 성공 시 토큰 추출
    const loginData = data?.data || data;
    const accessToken = loginData?.accessToken;
    const refreshToken = loginData?.refreshToken;

    // 2FA가 필요한 경우
    if (loginData?.twoFactorToken) {
      return NextResponse.json({
        requiresTwoFactor: true,
        twoFactorToken: loginData.twoFactorToken,
      });
    }

    // 토큰이 없으면 에러
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { message: '토큰이 반환되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 응답 데이터 준비
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
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined, // 30일 또는 세션
      });
    }
    
    // 프로젝트 ID 쿠키 설정
    if (responseData.projectId) {
      setProjectIdCookie(nextResponse, request, responseData.projectId);
    }
    
    return nextResponse;
  } catch (error) {
    logger.serverError('[Login API] 에러:', error);
    return NextResponse.json(
      { message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

