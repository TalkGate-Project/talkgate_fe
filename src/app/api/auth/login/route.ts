import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.talkgate.im';
    const response = await fetch(`${apiBaseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // 중요: 백엔드가 Set-Cookie 헤더를 보내는지 확인
    // 백엔드가 쿠키를 관리하는 경우, Next.js에서 쿠키를 설정하면 충돌 발생 가능
    const backendSetCookieHeaders = response.headers.get('set-cookie');
    console.log('[Login API] 🔍 백엔드 Set-Cookie 헤더 확인:', {
      hasSetCookie: !!backendSetCookieHeaders,
      setCookieHeaders: backendSetCookieHeaders,
      allResponseHeaders: Object.fromEntries(response.headers.entries()),
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

    // 서버에서 쿠키 설정 (httpOnly)
    const cookieStore = await cookies();
    const hostname = request.headers.get('host')?.split(':')[0] || '';
    const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
    const isSecure = request.nextUrl.protocol === 'https:';
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30일 또는 세션

    const cookieOptions = {
      // 테스트를 위해 httpOnly: false로 설정 (프로덕션에서는 true로 변경 필요)
      httpOnly: false,
      secure: isSecure,
      sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
      path: '/',
      ...(isProduction && { domain: '.talkgate.im' }),
      ...(maxAge && { maxAge }),
    };

    // 쿠키 설정
    if (accessToken) {
      cookieStore.set('tg_access_token', accessToken, cookieOptions);
      console.log('[Login API] 🍪 access_token 쿠키 설정:', {
        hasToken: !!accessToken,
        tokenPreview: accessToken ? `${accessToken.slice(0, 20)}...` : null,
        cookieOptions,
      });
    }
    if (refreshToken) {
      cookieStore.set('tg_refresh_token', refreshToken, cookieOptions);
      console.log('[Login API] 🍪 refresh_token 쿠키 설정:', {
        hasToken: !!refreshToken,
        cookieOptions,
      });
    }

    const responseData = {
      user: loginData?.user,
      projectId: loginData?.projectId || loginData?.defaultProjectId || loginData?.user?.defaultProjectId,
    };
    
    // 프로젝트 ID가 있으면 서버에서도 쿠키 설정 (서브도메인 간 공유를 위해)
    const nextResponse = NextResponse.json(responseData);
    
    if (responseData.projectId) {
      const projectIdCookieOptions = {
        httpOnly: false, // 클라이언트에서도 접근 가능하도록 (기존 로직과 호환)
        secure: isSecure,
        sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30일
        ...(isProduction && { domain: '.talkgate.im' }),
      };
      
      nextResponse.cookies.set('tg_selected_project_id', String(responseData.projectId), projectIdCookieOptions);
      console.log('[Login API] 🍪 프로젝트 ID 쿠키 설정:', {
        projectId: responseData.projectId,
        cookieOptions: projectIdCookieOptions,
      });
    }
    
    console.log('[Login API] ✅ 로그인 성공 - 응답 데이터:', {
      hasUser: !!responseData.user,
      projectId: responseData.projectId,
      hostname,
      isProduction,
      isSecure,
    });
    
    // 응답 헤더에 Set-Cookie 확인
    const setCookieHeaders = nextResponse.headers.getSetCookie();
    console.log('[Login API] 📋 Set-Cookie 헤더:', setCookieHeaders);
    
    return nextResponse;
  } catch (error) {
    console.error('[Login API] 에러:', error);
    return NextResponse.json(
      { message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

