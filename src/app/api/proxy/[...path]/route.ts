import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { getRememberPolicyFromRequest, setAuthCookies } from '@/lib/cookies';
import { buildClientIpProxyHeaders } from '@/lib/clientIpProxy';

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

// Vercel 서버리스 함수 기본 실행 제한(플랜별 상이, 기본 10~15초)이 apiClient의 클라이언트
// 타임아웃(analysis.ts의 create/reanalyze 등 최대 120초)보다 짧아 AI 분석처럼 오래 걸리는
// 요청은 클라이언트가 응답을 기다리기도 전에 이 함수가 먼저 종료되어 504로 끊긴다
// (2026-07-24 확인). 플랜이 허용하는 한도 내에서 클라이언트 타임아웃과 맞춰 연장.
export const maxDuration = 120;

// Refresh queue: 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
let refreshInFlight: Promise<{ accessToken?: string; refreshToken?: string } | null> | null = null;
// Refresh 성공 후 새 토큰 저장 (대기 중인 요청들이 사용)
let refreshedTokens: { accessToken?: string; refreshToken?: string } | null = null;

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
 * Refresh Token으로 Access Token 갱신
 */
/**
 * JWT 토큰의 payload를 디코딩 (디버깅용)
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    // 유효하지 않은 JWT 형식인 경우 null 반환 (디버깅용 함수이므로 에러 무시)
    return null;
  }
}

/**
 * SSE(text/event-stream) 응답인지 확인
 * - 이 응답은 버퍼링 없이 그대로 pass-through 해야 스트리밍이 유지된다
 */
function isEventStreamResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return response.ok && contentType.includes('text/event-stream');
}

/**
 * SSE 응답을 버퍼링 없이 그대로 클라이언트로 전달
 * - response.json()/text()로 모으면 스트리밍 효과가 사라지므로 body 스트림을 직접 넘긴다
 */
function passThroughEventStream(response: Response): Response {
  const streamHeaders = new Headers();
  streamHeaders.set('Content-Type', response.headers.get('content-type') || 'text/event-stream');
  streamHeaders.set('Cache-Control', 'no-cache, no-transform');
  streamHeaders.set('X-Accel-Buffering', 'no');
  return new Response(response.body, {
    status: response.status,
    headers: streamHeaders,
  });
}

async function refreshAccessToken(
  apiBaseUrl: string,
  refreshToken: string
): Promise<{ accessToken?: string; refreshToken?: string } | null> {
  try {
    // refreshToken의 만료 시간 확인 (디버깅용)
    const tokenPayload = decodeJwtPayload(refreshToken);
    const exp = tokenPayload?.exp;
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = exp ? exp - now : null;
    const isExpired = exp ? now >= exp : null;
    
    logger.server('[API Proxy] 🔄 refresh API 호출', {
      apiBaseUrl,
      hasRefreshToken: !!refreshToken,
      tokenExp: exp ? new Date(exp * 1000).toISOString() : null,
      now: new Date(now * 1000).toISOString(),
      expiresInSeconds: expiresIn,
      isExpired,
    });

    const requestBody = JSON.stringify({ refreshToken });

    const refreshResponse = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!refreshResponse.ok) {
      await refreshResponse.json().catch(() => ({}));
      logger.serverError('[API Proxy] ❌ 토큰 리프레시 실패:', {
        status: refreshResponse.status,
        statusText: refreshResponse.statusText,
      });
      return null;
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData?.data?.accessToken;
    const newRefreshToken = refreshData?.data?.refreshToken;

    if (newAccessToken || newRefreshToken) {
      logger.server('[API Proxy] ✅ 토큰 리프레시 성공');
      const tokens = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
      // refresh 성공 시 전역 변수에 저장 (대기 중인 요청들이 사용)
      refreshedTokens = tokens;
      return tokens;
    }

    return null;
  } catch (error) {
    logger.serverError('[API Proxy] ❌ 토큰 리프레시 예외:', error);
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

    logger.server('[API Proxy] 🔍 refreshToken 상태:', {
      hasRefreshToken: !!refreshToken,
    });
    
    // 요청 헤더 준비
    const headers: Record<string, string> = buildClientIpProxyHeaders(request.headers);

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
              logger.server('[API Proxy] 🔄 refresh 요청 - 쿠키에서 refreshToken을 body에 포함');
              bodyData.refreshToken = refreshToken;
              body = JSON.stringify(bodyData);
            }
          } catch {
            // JSON 파싱 실패 시 쿠키의 refreshToken으로 새 body 생성
            if (refreshToken) {
              logger.server('[API Proxy] 🔄 refresh 요청 - 쿠키의 refreshToken으로 body 생성');
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
          logger.server('[API Proxy] 🔄 refresh 요청 - 쿠키의 refreshToken으로 body 생성');
          body = JSON.stringify({ refreshToken });
        }
      }
    }

    // 응답 헤더 준비 (preflight에서 필요할 수 있음)
    const responseHeaders = new Headers();
    
    // Refresh preflight: refresh 진행 중이면 대기 후 토큰 갱신
    const canWaitForRefresh = !isRefreshRequest && !shouldSkipRefresh(apiPath, method);
    if (refreshInFlight && canWaitForRefresh) {
      logger.server('[API Proxy] ⏳ refresh 진행 중 - 요청 대기');
      try {
        const tokens = await refreshInFlight;
        const tokensToUse = tokens?.accessToken ? tokens : refreshedTokens;
        
        if (!tokensToUse?.accessToken) {
          logger.serverError('[API Proxy] ❌ refresh 실패 - 대기 중 요청은 401 반환');
          responseHeaders.set('X-Refresh-Attempted', 'true');
          responseHeaders.set('X-Refresh-Failed', 'true');
          responseHeaders.set('Content-Type', 'application/json');
          return NextResponse.json(
            { message: '인증이 만료되었습니다.' },
            { status: 401, headers: responseHeaders }
          );
        }
        
        headers['Authorization'] = `Bearer ${tokensToUse.accessToken}`;
        responseHeaders.set('X-Refresh-Attempted', 'true');
        responseHeaders.set('X-Refresh-Success', 'true');
      } catch (err) {
        logger.serverError('[API Proxy] ❌ refresh 대기 중 에러:', err);
        responseHeaders.set('X-Refresh-Attempted', 'true');
        responseHeaders.set('X-Refresh-Failed', 'true');
        responseHeaders.set('Content-Type', 'application/json');
        return NextResponse.json(
          { message: '인증이 만료되었습니다.' },
          { status: 401, headers: responseHeaders }
        );
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
    
    logger.server('[API Proxy] 📥 백엔드 응답:', {
      path: apiPath,
      method,
      status: response.status,
    });

    if (isEventStreamResponse(response)) {
      return passThroughEventStream(response);
    }

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
          logger.server('[API Proxy] ✅ refresh 응답 - 새 토큰을 쿠키에 설정');
          
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
            setAuthCookies(apiResponse, request, {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              rememberPolicy: getRememberPolicyFromRequest(request),
            });
          }

          return apiResponse;
        }
      } catch (refreshError) {
        logger.serverError('[API Proxy] ❌ refresh 응답 처리 실패:', refreshError);
      }
    }

    // 401 에러 처리 (메인 로직)
    // 정책: refresh 성공 시 원래 요청을 1회 재시도 (401은 서버에서 인증 거부된 상태로 부작용 없음)
    if (response.status === 401) {
      logger.server('[API Proxy] ❌ 401 에러 - refreshToken 상태:', {
        hasRefreshToken: !!refreshToken,
      });

      // 예외 API는 refresh하지 않음
      if (shouldSkipRefresh(apiPath, method)) {
        logger.server('[API Proxy] ⚠️ 예외 API - refresh하지 않음:', apiPath);
        responseHeaders.set('X-Refresh-Attempted', 'false');
        responseHeaders.set('X-Refresh-Skipped', 'true');
      }
      // refreshToken이 없으면 refresh 불가
      else if (!refreshToken) {
        logger.serverError('[API Proxy] ❌ refreshToken 없음 - 401 에러 반환');
        responseHeaders.set('X-Refresh-Attempted', 'false');
      }
      // refresh 시도
      else {
        // Refresh queue: 이미 진행 중이면 대기
        if (refreshInFlight) {
          logger.server('[API Proxy] ⏳ 이미 refresh 진행 중 - 대기');
          try {
            const tokens = await refreshInFlight;
            // refresh 성공한 경우 새 토큰 사용, 실패한 경우 전역 변수 확인
            const tokensToUse = tokens?.accessToken ? tokens : refreshedTokens;
            
            if (tokensToUse?.accessToken) {
              // 새 토큰으로 원래 요청 재시도
              headers['Authorization'] = `Bearer ${tokensToUse.accessToken}`;
              response = await executeRequest();

              if (isEventStreamResponse(response)) {
                return passThroughEventStream(response);
              }

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
              const apiResponse = isBlob
                ? new NextResponse(data, {
                    status: response.status,
                    headers: responseHeaders,
                  })
                : NextResponse.json(data, {
                    status: response.status,
                    headers: responseHeaders,
                  });
              
              setAuthCookies(apiResponse, request, {
                accessToken: tokensToUse.accessToken,
                refreshToken: tokensToUse.refreshToken,
                rememberPolicy: getRememberPolicyFromRequest(request),
              });
              
              return apiResponse;
            } else {
              // refresh 실패 - 원래 401 에러 반환
              logger.serverError('[API Proxy] ❌ refresh 실패 (대기 중) - 401 에러 반환');
              // refresh 시도했지만 실패했다는 것을 클라이언트에 알림
              responseHeaders.set('X-Refresh-Attempted', 'true');
              responseHeaders.set('X-Refresh-Failed', 'true');
              // refresh 실패 시 전역 변수 초기화
              refreshedTokens = null;
            }
          } catch (err) {
            logger.serverError('[API Proxy] ❌ refresh 대기 중 에러:', err);
            responseHeaders.set('X-Refresh-Attempted', 'true');
            responseHeaders.set('X-Refresh-Failed', 'true');
          }
        } else {
          // 새 refresh 시작
          // refresh 시작 전 전역 변수 초기화 (이전 refresh 결과 무효화)
          refreshedTokens = null;
          refreshInFlight = refreshAccessToken(apiBaseUrl, refreshToken).finally(() => {
            refreshInFlight = null;
          });
          
          try {
            const tokens = await refreshInFlight;
            if (tokens?.accessToken) {
              // 새 토큰으로 원래 요청 재시도
              headers['Authorization'] = `Bearer ${tokens.accessToken}`;
              response = await executeRequest();

              if (isEventStreamResponse(response)) {
                return passThroughEventStream(response);
              }

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
              const apiResponse = isBlob
                ? new NextResponse(data, {
                    status: response.status,
                    headers: responseHeaders,
                  })
                : NextResponse.json(data, {
                    status: response.status,
                    headers: responseHeaders,
                  });
              
              setAuthCookies(apiResponse, request, {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                rememberPolicy: getRememberPolicyFromRequest(request),
              });
              
              // refresh 성공 표시
              apiResponse.headers.set('X-Refresh-Attempted', 'true');
              apiResponse.headers.set('X-Refresh-Success', 'true');
              
              return apiResponse;
            } else {
              // refresh 실패 - 원래 401 에러 반환
              logger.serverError('[API Proxy] ❌ refresh 실패 - 401 에러 반환');
              // refresh 시도했지만 실패했다는 것을 클라이언트에 알림
              responseHeaders.set('X-Refresh-Attempted', 'true');
              responseHeaders.set('X-Refresh-Failed', 'true');
              // refresh 실패 시 전역 변수 초기화
              refreshedTokens = null;
            }
          } catch (err) {
            logger.serverError('[API Proxy] ❌ refresh 중 에러:', err);
            responseHeaders.set('X-Refresh-Attempted', 'true');
            responseHeaders.set('X-Refresh-Failed', 'true');
            // refresh 실패 시 전역 변수 초기화
            refreshedTokens = null;
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
    logger.serverError('[API Proxy] 에러:', error);
    return NextResponse.json(
      { message: 'API 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
