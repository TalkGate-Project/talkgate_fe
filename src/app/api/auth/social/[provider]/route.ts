import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, setProjectIdCookie } from '@/lib/cookies';

/**
 * 소셜 로그인 API 엔드포인트
 * 
 * 서버에서 쿠키를 httpOnly로 설정하여 보안을 강화합니다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const resolvedParams = await params;
  const provider = resolvedParams.provider; // google, kakao, naver
  
  try {
    const body = await request.json();
    const { code, callbackUrl } = body;

    // API 서버로 소셜 로그인 요청 전달
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.talkgate.im';
    const response = await fetch(`${apiBaseUrl}/v1/auth/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, callbackUrl }),
    });

    const data = await response.json();

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
        success: true,
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

    const responseData = {
      success: true,
      requiresTwoFactor: false,
      user: loginData?.user,
      projectId: loginData?.projectId || loginData?.defaultProjectId || loginData?.user?.defaultProjectId,
    };
    
    const nextResponse = NextResponse.json(responseData);
    
    // ✅ 새로운 쿠키 유틸리티 사용
    if (accessToken && refreshToken) {
      setAuthCookies(nextResponse, request, {
        accessToken,
        refreshToken,
        maxAge: 60 * 60 * 24 * 30, // 소셜 로그인은 기본 30일
      });
    }
    
    // 프로젝트 ID 쿠키 설정
    if (responseData.projectId) {
      setProjectIdCookie(nextResponse, request, responseData.projectId);
    }
    
    return nextResponse;
  } catch (error) {
    console.error(`[Social Login API] ${provider} 에러:`, error);
    return NextResponse.json(
      { message: '소셜 로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

