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
    const headers: Record<string, string> = {};

    // 클라이언트에서 전달된 헤더 확인
    const clientHeaders = request.headers;
    const clientAuthHeader = clientHeaders.get('Authorization');

    // Authorization 헤더 추가
    // 1. 클라이언트가 직접 보낸 Authorization 헤더가 있으면 우선 사용 (회원가입 직후 등)
    // 2. 없으면 httpOnly 쿠키에서 읽은 토큰 사용
    if (clientAuthHeader) {
      headers['Authorization'] = clientAuthHeader;
      console.log('[API Proxy] ✅ 클라이언트 Authorization 헤더 사용');
    } else if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('[API Proxy] ✅ 쿠키 기반 Authorization 헤더 추가됨');
    } else {
      console.warn('[API Proxy] ⚠️ access_token 없음 - 인증 실패 가능');
    }

    // x-project-id 헤더 전달
    const xProjectId = clientHeaders.get('x-project-id');
    if (xProjectId) {
      headers['x-project-id'] = xProjectId;
    }

    // Accept 헤더 전달 (Blob 응답을 위해 중요)
    const acceptHeader = clientHeaders.get('Accept');
    if (acceptHeader) {
      headers['Accept'] = acceptHeader;
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
        // FormData는 브라우저가 자동으로 Content-Type을 설정하므로 헤더에서 제거
      } else if (contentType?.includes('text/')) {
        body = await request.text();
        headers['Content-Type'] = contentType;
      } else if (contentType) {
        body = await request.blob();
        headers['Content-Type'] = contentType;
      } else {
        // Content-Type이 없는 경우 기본값 설정
        headers['Content-Type'] = 'application/json';
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
    let isBlob = false;

    if (contentTypeHeader.includes('application/json')) {
      data = await response.json();
    } else if (contentTypeHeader.startsWith('text/')) {
      data = await response.text();
    } else {
      // Blob 응답 (엑셀 파일 등)
      data = await response.blob();
      isBlob = true;
      console.log('[API Proxy] 📦 Blob 응답 수신:', {
        size: data.size,
        type: data.type,
        contentType: contentTypeHeader,
      });
    }

    // 응답 헤더 전달
    // 중요: 백엔드가 Set-Cookie 헤더를 보내는 경우, 이를 전달해야 함
    // 백엔드가 쿠키를 관리하는 경우 Next.js에서 쿠키를 설정하지 않아야 함
    const responseHeaders = new Headers();
    if (contentTypeHeader) {
      responseHeaders.set('Content-Type', contentTypeHeader);
    }
    
    // Content-Disposition 헤더 전달 (파일 다운로드용)
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition);
    }
    
    // 백엔드 응답의 Set-Cookie 헤더 확인 및 전달
    const backendSetCookieHeaders = response.headers.get('set-cookie');
    if (backendSetCookieHeaders) {
      console.log('[API Proxy] 🍪 백엔드 Set-Cookie 헤더 감지:', backendSetCookieHeaders);
      // Set-Cookie 헤더는 여러 개일 수 있으므로 getAll 사용
      const allSetCookies = response.headers.getSetCookie();
      allSetCookies.forEach((cookie) => {
        responseHeaders.append('Set-Cookie', cookie);
      });
      console.log('[API Proxy] 🍪 Set-Cookie 헤더 전달:', allSetCookies);
    }

    // 401 에러 시 토큰 갱신 시도
    // 참고: 미들웨어에서 이미 토큰 리프레시를 처리하지만, 
    // 미들웨어가 처리하지 못한 경우를 대비한 백업 로직입니다.
    // Route Handler에서는 cookies().set()이 제대로 작동하지 않을 수 있으므로,
    // NextResponse를 사용하여 쿠키를 설정합니다.
    if (response.status === 401 && accessToken) {
      try {
        const refreshToken = cookieStore.get('tg_refresh_token')?.value;
        if (refreshToken) {
          console.log('[API Proxy] 🔄 401 에러 발생 - 토큰 리프레시 시도 (백업 로직)');
          
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
              console.log('[API Proxy] ✅ 토큰 리프레시 성공 - 새 토큰 설정 (백업 로직)');
              
              // 원래 요청 재시도
              headers['Authorization'] = `Bearer ${newAccessToken || accessToken}`;
              const retryResponse = await fetch(url, {
                method,
                headers,
                body,
              });

              const retryContentType = retryResponse.headers.get('content-type') || '';
              let retryData: any;
              let retryIsBlob = false;
              if (retryContentType.includes('application/json')) {
                retryData = await retryResponse.json();
              } else if (retryContentType.startsWith('text/')) {
                retryData = await retryResponse.text();
              } else {
                retryData = await retryResponse.blob();
                retryIsBlob = true;
              }

              // NextResponse를 사용하여 쿠키 설정
              // Route Handler에서는 cookies().set()이 제대로 작동하지 않을 수 있으므로
              // NextResponse의 cookies API를 사용합니다.
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

              // Blob 응답인 경우 NextResponse에 직접 전달
              const apiResponse = retryIsBlob
                ? new NextResponse(retryData, {
                    status: retryResponse.status,
                    headers: responseHeaders,
                  })
                : NextResponse.json(retryData, {
                    status: retryResponse.status,
                    headers: responseHeaders,
                  });

              // NextResponse의 cookies API 사용
              if (newAccessToken) {
                apiResponse.cookies.set('tg_access_token', newAccessToken, cookieOptions);
              }
              if (newRefreshToken) {
                apiResponse.cookies.set('tg_refresh_token', newRefreshToken, cookieOptions);
              }

              return apiResponse;
            }
          }
        }
      } catch (refreshError) {
        console.error('[API Proxy] ❌ 토큰 갱신 실패 (백업 로직):', refreshError);
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

    // Blob 응답인 경우 NextResponse에 직접 전달 (JSON 변환하지 않음)
    if (isBlob) {
      return new NextResponse(data, {
        status: response.status,
        headers: responseHeaders,
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

