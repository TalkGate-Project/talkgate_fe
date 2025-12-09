import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API 프록시 라우트
 * 
 * 클라이언트에서 백엔드 API를 호출할 때, 이 프록시를 통해 요청합니다.
 * 서버에서 httpOnly 쿠키를 읽어서 백엔드 API에 전달하고, 응답을 그대로 반환합니다.
 * 
 * 사용법: /api/proxy/v1/auth/user -> 백엔드의 /v1/auth/user로 프록시
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const apiPath = `/${params.path.join('/')}`;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.talkgate.im';
    const url = `${apiBaseUrl}${apiPath}${request.nextUrl.search}`;

    // httpOnly 쿠키에서 토큰 읽기
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('tg_access_token')?.value;
    const refreshToken = cookieStore.get('tg_refresh_token')?.value;
    
    // 디버깅: 쿠키 읽기 확인
    const allCookies = cookieStore.getAll();
    console.log('[API Proxy] 🍪 쿠키 상태:', {
      path: apiPath,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? `${accessToken.slice(0, 20)}...` : null,
      allCookieNames: allCookies.map(c => c.name),
      host: request.headers.get('host'),
    });
    
    // 요청 헤더 준비
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Authorization 헤더 추가 (httpOnly 쿠키에서 읽은 토큰 사용)
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('[API Proxy] ✅ Authorization 헤더 추가됨');
    } else {
      console.warn('[API Proxy] ⚠️ access_token 쿠키가 없음 - 인증 실패 가능');
    }

    // 클라이언트에서 전달된 헤더 중 필요한 것만 전달 (보안상 중요)
    const clientHeaders = request.headers;
    const xProjectId = clientHeaders.get('x-project-id');
    if (xProjectId) {
      headers['x-project-id'] = xProjectId;
    }

    // 요청 본문 처리
    let body: BodyInit | undefined;
    const contentType = clientHeaders.get('content-type');
    
    if (method !== 'GET' && method !== 'DELETE') {
      if (contentType?.includes('application/json')) {
        body = await request.text();
        headers['Content-Type'] = 'application/json';
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
        delete headers['Content-Type']; // FormData는 브라우저가 자동 설정
      } else if (contentType?.includes('text/')) {
        body = await request.text();
        headers['Content-Type'] = contentType;
      } else {
        body = await request.blob();
      }
    }

    // 백엔드 API 호출
    console.log('[API Proxy] 🌐 백엔드 API 호출:', {
      url,
      method,
      hasAuthHeader: !!headers['Authorization'],
    });
    
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    
    console.log('[API Proxy] 📥 백엔드 응답:', {
      status: response.status,
      statusText: response.statusText,
    });

    // 응답 데이터 읽기
    const contentTypeHeader = response.headers.get('content-type') || '';
    let data: any;

    if (contentTypeHeader.includes('application/json')) {
      data = await response.json();
    } else if (contentTypeHeader.startsWith('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // 응답 헤더 전달 (필요한 것만)
    const responseHeaders = new Headers();
    if (contentTypeHeader) {
      responseHeaders.set('Content-Type', contentTypeHeader);
    }

    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401 && accessToken) {
      try {
        const refreshToken = cookieStore.get('tg_refresh_token')?.value;
        if (refreshToken) {
          const refreshResponse = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newAccessToken = refreshData?.data?.accessToken;
            const newRefreshToken = refreshData?.data?.refreshToken;

            if (newAccessToken || newRefreshToken) {
              // 새 토큰을 쿠키에 설정
              const hostname = request.headers.get('host')?.split(':')[0] || '';
              const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
              const isSecure = request.nextUrl.protocol === 'https:';

              const cookieOptions = {
                httpOnly: true,
                secure: isSecure,
                sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
                path: '/',
                ...(isProduction && { domain: '.talkgate.im' }),
                maxAge: 60 * 60 * 24 * 30, // 30일
              };

              if (newAccessToken) {
                cookieStore.set('tg_access_token', newAccessToken, cookieOptions);
              }
              if (newRefreshToken) {
                cookieStore.set('tg_refresh_token', newRefreshToken, cookieOptions);
              }

              // 원래 요청 재시도
              headers['Authorization'] = `Bearer ${newAccessToken || accessToken}`;
              const retryResponse = await fetch(url, {
                method,
                headers,
                body,
              });

              const retryContentType = retryResponse.headers.get('content-type') || '';
              let retryData: any;
              if (retryContentType.includes('application/json')) {
                retryData = await retryResponse.json();
              } else if (retryContentType.startsWith('text/')) {
                retryData = await retryResponse.text();
              } else {
                retryData = await retryResponse.blob();
              }

              return NextResponse.json(retryData, {
                status: retryResponse.status,
                headers: responseHeaders,
              });
            }
          }
        }
      } catch (refreshError) {
        console.error('[API Proxy] 토큰 갱신 실패:', refreshError);
        // 토큰 갱신 실패 시 원래 에러 응답 반환
      }
    }
    
    // 401 에러인데 토큰 갱신 실패 또는 토큰 자체가 없는 경우 원본 에러 반환
    if (response.status === 401) {
      console.error('[API Proxy] ❌ 인증 실패 - 원본 에러 응답 반환:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        error: data,
      });
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy] 에러:', error);
    return NextResponse.json(
      { message: 'API 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

