import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, setProjectIdCookie } from '@/lib/cookies';

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

    console.log('[2FA Login API] 📥 요청 받음:', {
      hasToken: !!twoFactorToken,
      hasTotpCode: !!totpCode,
      hasCode: !!code,
      finalTotpCode: !!finalTotpCode,
      bodyKeys: Object.keys(body),
    });

    if (!twoFactorToken || !finalTotpCode) {
      console.error('[2FA Login API] ❌ 필수 파라미터 누락:', { 
        twoFactorToken: !!twoFactorToken, 
        totpCode: !!totpCode,
        code: !!code,
        finalTotpCode: !!finalTotpCode,
      });
      return NextResponse.json(
        { message: 'twoFactorToken과 totpCode가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 서버로 2FA 로그인 요청 전달
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.talkgate.im';
    const apiUrl = `${apiBaseUrl}/v1/auth/two-factor/login`;
    
    console.log('[2FA Login API] 🌐 백엔드 API 호출:', {
      url: apiUrl,
      apiBaseUrl,
      twoFactorToken: twoFactorToken ? `${twoFactorToken.slice(0, 20)}...` : null,
      totpCodeLength: finalTotpCode?.length,
    });
    
    // 백엔드는 { twoFactorToken, totpCode } 형식을 기대함 (code가 아니라 totpCode!)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        twoFactorToken, 
        totpCode: finalTotpCode, // 백엔드는 totpCode를 기대함
      }),
    });
    
    console.log('[2FA Login API] 📥 백엔드 응답:', {
      status: response.status,
      statusText: response.statusText,
    });

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[2FA Login API] ❌ 응답 파싱 실패:', parseError);
      const text = await response.text();
      console.error('[2FA Login API] ❌ 원본 응답 텍스트:', text);
      return NextResponse.json(
        { message: '백엔드 응답 파싱 실패', originalError: text },
        { status: 500 }
      );
    }
    
    console.log('[2FA Login API] 📦 백엔드 응답 데이터:', {
      hasData: !!data,
      hasResult: !!data?.result,
      hasDataField: !!data?.data,
      status: response.status,
      errorCode: data?.code,
      errorMessage: data?.message,
      fullData: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('[2FA Login API] ❌ 백엔드 에러 응답:', {
        status: response.status,
        statusText: response.statusText,
        error: data,
        requestBody: JSON.stringify({ twoFactorToken: twoFactorToken ? `${twoFactorToken.slice(0, 20)}...` : null, code: code ? `${code.slice(0, 3)}...` : null }),
      });
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
      console.log('[2FA Login API] 🍪 인증 쿠키 설정 완료');
    }
    
    // 프로젝트 ID 쿠키 설정
    if (responseData.projectId) {
      setProjectIdCookie(nextResponse, request, responseData.projectId);
      console.log('[2FA Login API] 🍪 프로젝트 ID 쿠키 설정:', responseData.projectId);
    }
    
    console.log('[2FA Login API] ✅ 로그인 성공');
    
    return nextResponse;
  } catch (error) {
    console.error('[2FA Login API] 에러:', error);
    return NextResponse.json(
      { message: '2FA 로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

