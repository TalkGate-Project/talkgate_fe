import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API 프록시 라우트
 * 
 * 클라이언트에서 백엔드 API를 호출할 때, 이 프록시를 통해 요청합니다.
 * 서버에서 쿠키를 읽어서 백엔드 API에 전달하고, 응답을 그대로 반환합니다.
 * 
 * [401 처리 정책]
 * - 모든 API는 401 발생시 refresh를 1회 시도
 * - refresh 성공시 원래 요청 retry
 * - refresh 실패시 401 에러 반환 (클라이언트에서 logout 처리)
 * - 예외: 403은 refresh하지 않음, 특정 API는 refresh하지 않음
 * - 큐/동기화: refresh 진행중이면 새 refresh를 만들지 말고 대기
 * 
 * 사용법: /api/proxy/v1/auth/user -> 백엔드의 /v1/auth/user로 프록시
 */

// Refresh queue: 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
let refreshInFlight: Promise<{ accessToken?: string; refreshToken?: string } | null> | null = null;

/**
 * 예외 API 목록: 이 API들은 401 발생시 refresh하지 않음
 */
const SKIP_REFRESH_PATHS = [
  '/v1/auth/login',
  '/v1/auth/signup',
  '/v1/auth/two-factor',
  '/v1/sms/sender-numbers/member', // 본인인증 미완료 시 401 발생 가능
];

/**
 * 예외 API인지 확인
 */
function shouldSkipRefresh(apiPath: string, method: string): boolean {
  // 2FA 관련 API
  if (apiPath.includes('/two-factor')) return true;
  
  // 발신번호 등록 API (POST만)
  if (method === 'POST' && apiPath === '/v1/sms/sender-numbers/member') return true;
  
  // 기타 예외 경로
  return SKIP_REFRESH_PATHS.some(path => apiPath.startsWith(path));
}

/**
 * 쿠키 옵션 생성
 */
function getCookieOptions(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const isProduction = hostname.endsWith('.talkgate.im') || hostname === 'talkgate.im';
  const isSecure = request.nextUrl.protocol === 'https:';

  return {
    httpOnly: false, // Refresh Token은 HttpOnly가 아님 (정책)
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    path: '/',
    ...(isProduction && { domain: '.talkgate.im' }),
    maxAge: 60 * 60 * 24 * 30, // 30일
  };
}

/**
 * Refresh Token으로 Access Token 갱신
 */
async function refreshAccessToken(
  apiBaseUrl: string,
  refreshToken: string
): Promise<{ accessToken?: string; refreshToken?: string } | null> {
  try {
    console.log('[API Proxy] 🔄 토큰 리프레시 시도');
    
    const refreshResponse = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json().catch(() => ({}));
      console.error('[API Proxy] ❌ 토큰 리프레시 실패:', {
        status: refreshResponse.status,
        error: errorData,
      });
      return null;
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData?.data?.accessToken;
    const newRefreshToken = refreshData?.data?.refreshToken;

    if (newAccessToken || newRefreshToken) {
      console.log('[API Proxy] ✅ 토큰 리프레시 성공');
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }

    return null;
  } catch (error) {
    console.error('[API Proxy] ❌ 토큰 리프레시 예외:', error);
    return null;
  }
}

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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (
      process.env.NODE_ENV === "production"
        ? "https://api.talkgate.im"
        : "https://api-dev.talkgate.im"
    );
    const url = `${apiBaseUrl}${apiPath}${request.nextUrl.search}`;

    // 쿠키에서 토큰 읽기
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('tg_access_token')?.value;
    let refreshToken = cookieStore.get('tg_refresh_token')?.value;
    
    // Cookie 헤더에서도 읽기 시도 (서브도메인 쿠키 공유 문제 대비)
    if (!refreshToken) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {} as Record<string, string>);
        
        refreshToken = cookies['tg_refresh_token'] || refreshToken;
      }
    }
    
    // 요청 헤더 준비
    const headers: Record<string, string> = {};

    // 클라이언트에서 전달된 헤더 확인
    const clientHeaders = request.headers;
    const clientAuthHeader = clientHeaders.get('Authorization');

    // Authorization 헤더 추가
    // 1. 클라이언트가 직접 보낸 Authorization 헤더가 있으면 우선 사용
    // 2. 없으면 쿠키에서 읽은 토큰 사용
    if (clientAuthHeader) {
      headers['Authorization'] = clientAuthHeader;
    } else if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
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
    
    // /v1/auth/refresh 요청인 경우 특별 처리
    const isRefreshRequest = method === 'POST' && apiPath === '/v1/auth/refresh';
    
    if (method !== 'GET' && method !== 'DELETE') {
      if (contentType?.includes('application/json')) {
        body = await request.text();
        headers['Content-Type'] = 'application/json';
        
        // /v1/auth/refresh 요청이고 body에 refreshToken이 없는 경우 쿠키에서 읽기
        if (isRefreshRequest) {
          try {
            const bodyData = body ? JSON.parse(body) : {};
            if (!bodyData.refreshToken && refreshToken) {
              console.log('[API Proxy] 🔄 refresh 요청 - 쿠키에서 refreshToken을 body에 포함');
              bodyData.refreshToken = refreshToken;
              body = JSON.stringify(bodyData);
            }
          } catch (e) {
            // JSON 파싱 실패 시 쿠키의 refreshToken으로 새 body 생성
            if (refreshToken) {
              console.log('[API Proxy] 🔄 refresh 요청 - 쿠키의 refreshToken으로 body 생성');
              body = JSON.stringify({ refreshToken });
            }
          }
        }
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
      } else if (contentType?.includes('text/')) {
        body = await request.text();
        headers['Content-Type'] = contentType;
      } else if (contentType) {
        body = await request.blob();
        headers['Content-Type'] = contentType;
      } else {
        headers['Content-Type'] = 'application/json';
        
        // /v1/auth/refresh 요청인 경우 쿠키의 refreshToken으로 body 생성
        if (isRefreshRequest && refreshToken) {
          console.log('[API Proxy] 🔄 refresh 요청 - 쿠키의 refreshToken으로 body 생성');
          body = JSON.stringify({ refreshToken });
        }
      }
    }

    // 원래 요청 실행 함수
    const executeRequest = async (): Promise<Response> => {
      return await fetch(url, {
        method,
        headers,
        body,
      });
    };

    // 백엔드 API 호출
    let response = await executeRequest();
    
    console.log('[API Proxy] 📥 백엔드 응답:', {
      path: apiPath,
      method,
      status: response.status,
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
      data = await response.blob();
      isBlob = true;
    }

    // 응답 헤더 준비
    const responseHeaders = new Headers();
    if (contentTypeHeader) {
      responseHeaders.set('Content-Type', contentTypeHeader);
    }
    
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition);
    }

    // /v1/auth/refresh 응답인 경우 쿠키 설정
    if (isRefreshRequest && response.ok) {
      try {
        const refreshData = typeof data === 'object' && data !== null ? data : {};
        const newAccessToken = (refreshData as any)?.data?.accessToken;
        const newRefreshToken = (refreshData as any)?.data?.refreshToken;

        if (newAccessToken || newRefreshToken) {
          console.log('[API Proxy] ✅ refresh 응답 - 새 토큰을 쿠키에 설정');
          
          const cookieOptions = getCookieOptions(request);
          const apiResponse = isBlob
            ? new NextResponse(data, {
                status: response.status,
                headers: responseHeaders,
              })
            : NextResponse.json(data, {
                status: response.status,
                headers: responseHeaders,
              });

          if (newAccessToken) {
            apiResponse.cookies.set('tg_access_token', newAccessToken, cookieOptions);
          }
          if (newRefreshToken) {
            apiResponse.cookies.set('tg_refresh_token', newRefreshToken, cookieOptions);
          }

          return apiResponse;
        }
      } catch (refreshError) {
        console.error('[API Proxy] ❌ refresh 응답 처리 실패:', refreshError);
      }
    }

    // 401 에러 처리 (메인 로직)
    if (response.status === 401) {
      // 예외 API는 refresh하지 않음
      if (shouldSkipRefresh(apiPath, method)) {
        console.log('[API Proxy] ⚠️ 예외 API - refresh하지 않음:', apiPath);
        responseHeaders.set('X-Refresh-Attempted', 'false');
        responseHeaders.set('X-Refresh-Skipped', 'true');
      }
      // refreshToken이 없으면 refresh 불가
      else if (!refreshToken) {
        console.error('[API Proxy] ❌ refreshToken 없음 - 401 에러 반환');
        responseHeaders.set('X-Refresh-Attempted', 'false');
      }
      // refresh 시도
      else {
        // Refresh queue: 이미 진행 중이면 대기
        if (refreshInFlight) {
          console.log('[API Proxy] ⏳ 이미 refresh 진행 중 - 대기');
          try {
            const tokens = await refreshInFlight;
            if (tokens?.accessToken) {
              // 새 토큰으로 원래 요청 재시도
              headers['Authorization'] = `Bearer ${tokens.accessToken}`;
              response = await executeRequest();
              
              // 재시도 응답 처리
              const retryContentType = response.headers.get('content-type') || '';
              if (retryContentType.includes('application/json')) {
                data = await response.json();
              } else if (retryContentType.startsWith('text/')) {
                data = await response.text();
              } else {
                data = await response.blob();
                isBlob = true;
              }
              
              // 쿠키 업데이트
              const cookieOptions = getCookieOptions(request);
              const apiResponse = isBlob
                ? new NextResponse(data, {
                    status: response.status,
                    headers: responseHeaders,
                  })
                : NextResponse.json(data, {
                    status: response.status,
                    headers: responseHeaders,
                  });
              
              if (tokens.refreshToken) {
                apiResponse.cookies.set('tg_refresh_token', tokens.refreshToken, cookieOptions);
              }
              if (tokens.accessToken) {
                apiResponse.cookies.set('tg_access_token', tokens.accessToken, cookieOptions);
              }
              
              return apiResponse;
            } else {
              // refresh 실패 - 원래 401 에러 반환
              console.error('[API Proxy] ❌ refresh 실패 (대기 중) - 401 에러 반환');
              // refresh 시도했지만 실패했다는 것을 클라이언트에 알림
              responseHeaders.set('X-Refresh-Attempted', 'true');
              responseHeaders.set('X-Refresh-Failed', 'true');
            }
          } catch (err) {
            console.error('[API Proxy] ❌ refresh 대기 중 에러:', err);
            responseHeaders.set('X-Refresh-Attempted', 'true');
            responseHeaders.set('X-Refresh-Failed', 'true');
          }
        } else {
          // 새 refresh 시작
          refreshInFlight = refreshAccessToken(apiBaseUrl, refreshToken).finally(() => {
            refreshInFlight = null;
          });
          
          try {
            const tokens = await refreshInFlight;
            if (tokens?.accessToken) {
              // 새 토큰으로 원래 요청 재시도
              headers['Authorization'] = `Bearer ${tokens.accessToken}`;
              response = await executeRequest();
              
              // 재시도 응답 처리
              const retryContentType = response.headers.get('content-type') || '';
              if (retryContentType.includes('application/json')) {
                data = await response.json();
              } else if (retryContentType.startsWith('text/')) {
                data = await response.text();
              } else {
                data = await response.blob();
                isBlob = true;
              }
              
              // 쿠키 업데이트
              const cookieOptions = getCookieOptions(request);
              const apiResponse = isBlob
                ? new NextResponse(data, {
                    status: response.status,
                    headers: responseHeaders,
                  })
                : NextResponse.json(data, {
                    status: response.status,
                    headers: responseHeaders,
                  });
              
              if (tokens.accessToken) {
                apiResponse.cookies.set('tg_access_token', tokens.accessToken, cookieOptions);
              }
              if (tokens.refreshToken) {
                apiResponse.cookies.set('tg_refresh_token', tokens.refreshToken, cookieOptions);
              }
              
              // refresh 성공 표시
              apiResponse.headers.set('X-Refresh-Attempted', 'true');
              apiResponse.headers.set('X-Refresh-Success', 'true');
              
              return apiResponse;
            } else {
              // refresh 실패 - 원래 401 에러 반환
              console.error('[API Proxy] ❌ refresh 실패 - 401 에러 반환');
              // refresh 시도했지만 실패했다는 것을 클라이언트에 알림
              responseHeaders.set('X-Refresh-Attempted', 'true');
              responseHeaders.set('X-Refresh-Failed', 'true');
            }
          } catch (err) {
            console.error('[API Proxy] ❌ refresh 중 에러:', err);
            responseHeaders.set('X-Refresh-Attempted', 'true');
            responseHeaders.set('X-Refresh-Failed', 'true');
          }
        }
      }
    }

    // 백엔드 응답의 Set-Cookie 헤더 확인 및 전달
    const backendSetCookieHeaders = response.headers.get('set-cookie');
    if (backendSetCookieHeaders) {
      const allSetCookies = response.headers.getSetCookie();
      allSetCookies.forEach((cookie) => {
        responseHeaders.append('Set-Cookie', cookie);
      });
    }

    // 최종 응답 반환
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
