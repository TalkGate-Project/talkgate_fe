// Centralized environment variables with minimal runtime validation
// Use NEXT_PUBLIC_* for client-side. Server-only vars should not be imported in the client bundle.

export type AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_API_TIMEOUT_MS: number; // integer milliseconds
  NEXT_PUBLIC_WS_CHAT_BASE_URL?: string; // WebSocket URL for chat namespace
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL?: string; // WebSocket URL for notification namespace
  NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string; // 현재 환경에 맞는 Google Client ID (자동 선택)
  NEXT_PUBLIC_KAKAO_REST_API_KEY?: string; // 현재 환경에 맞는 Kakao REST API Key (자동 선택)
  NEXT_PUBLIC_NAVER_CLIENT_ID?: string; // 현재 환경에 맞는 Naver Client ID (자동 선택)
};

/**
 * 환경별 OAuth Client ID 환경 변수 타입
 */
export type OAuthClientIds = {
  NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV?: string;
  NEXT_PUBLIC_GOOGLE_CLIENT_ID_PROD?: string;
  NEXT_PUBLIC_KAKAO_REST_API_KEY_DEV?: string;
  NEXT_PUBLIC_KAKAO_REST_API_KEY_PROD?: string;
  NEXT_PUBLIC_NAVER_CLIENT_ID_DEV?: string;
  NEXT_PUBLIC_NAVER_CLIENT_ID_PROD?: string;
};

/**
 * 현재 환경이 프로덕션인지 확인합니다.
 * 서버 사이드에서는 도메인을 확인할 수 없으므로 NODE_ENV를 사용하며,
 * 클라이언트 사이드에서는 도메인을 확인합니다.
 */
function isProductionEnvironment(): boolean {
  // 클라이언트 사이드에서는 도메인 기반 판단
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host.endsWith(".talkgate.im") || host === "talkgate.im";
  }
  
  // 서버 사이드에서는 NODE_ENV 기반 판단
  // Vercel 등에서는 프로덕션 환경에서 NODE_ENV가 'production'으로 설정됨
  return process.env.NODE_ENV === "production";
}

function readString(key: keyof AppEnv, fallback?: string): string {
  const value = process.env[key as string] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${String(key)}`);
  }
  return value;
}

function readOptionalString(key: keyof AppEnv): string | undefined {
  const value = process.env[key as string];
  if (value === undefined || value === "") return undefined;
  return value;
}

function readNumber(key: keyof AppEnv, fallback?: number): number {
  const raw = process.env[key as string];
  if ((raw === undefined || raw === "") && fallback !== undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${String(key)}: ${raw}`);
  }
  return parsed;
}

// Helper to derive WebSocket URL from API base URL if not explicitly set
function getWebSocketUrl(baseUrl: string, namespace: string): string {
  // Convert http/https to ws/wss
  if (baseUrl.startsWith("https://")) {
    return baseUrl.replace("https://", "wss://") + `/${namespace}`;
  }
  if (baseUrl.startsWith("http://")) {
    return baseUrl.replace("http://", "ws://") + `/${namespace}`;
  }
  // If no protocol, assume ws:// for localhost or wss:// otherwise
  const protocol = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") ? "ws://" : "wss://";
  return `${protocol}${baseUrl}/${namespace}`;
}

// Read API base URL first
// NOTE: Temporary override to force DEV backend for all environments.
// This prevents the MVP (deployed on Vercel) from pointing at the production API.
// TODO: Re-enable environment-based selection below and remove the hard-coded URL.
//   const apiBaseUrl = readString(
//     "NEXT_PUBLIC_API_BASE_URL",
//     process.env.NODE_ENV === "production" ? "https://api.talkgate.im" : "https://api-dev.talkgate.im"
//   );
const apiBaseUrl = "https://api-dev.talkgate.im";

// Next.js는 NEXT_PUBLIC_ 환경 변수를 빌드 시점에 인라인합니다.
// 중요: 동적 접근 (process.env[key])은 인라인되지 않으므로, 정적으로 접근해야 합니다.
// 단, 런타임에 환경을 판단하여 선택해야 하는 경우 클라이언트 사이드에서만 동적으로 접근합니다.

// 환경별 OAuth Client ID 읽기
const googleClientIdDev = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV || undefined;
const googleClientIdProd = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_PROD || undefined;
const kakaoRestApiKeyDev = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY_DEV || undefined;
const kakaoRestApiKeyProd = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY_PROD || undefined;
const naverClientIdDev = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID_DEV || undefined;
const naverClientIdProd = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID_PROD || undefined;

// 호환성을 위해 단일 환경 변수도 지원 (우선순위 낮음)
const googleClientIdFallback = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined;
const kakaoRestApiKeyFallback = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || undefined;
const naverClientIdFallback = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || undefined;

/**
 * 현재 환경에 맞는 OAuth Client ID를 반환합니다.
 * 클라이언트 사이드에서는 런타임에 도메인을 확인하여 선택하고,
 * 서버 사이드에서는 빌드 시점에 인라인된 값 중 하나를 사용합니다.
 * 
 * 주의: 클라이언트 컴포넌트에서 사용 시 런타임에 환경을 판단합니다.
 */
function getOAuthClientId(
  devValue: string | undefined,
  prodValue: string | undefined,
  fallbackValue: string | undefined
): string | undefined {
  // 클라이언트 사이드에서는 런타임에 환경 판단
  if (typeof window !== "undefined") {
    const isProd = isProductionEnvironment();
    return isProd ? (prodValue || fallbackValue) : (devValue || fallbackValue);
  }
  
  // 서버 사이드에서는 빌드 시점 값 사용
  // 프로덕션 빌드인 경우 프로덕션 값 우선, 개발 빌드인 경우 개발 값 우선
  const isProd = process.env.NODE_ENV === "production";
  return isProd ? (prodValue || fallbackValue) : (devValue || fallbackValue);
}

export const env: AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  NEXT_PUBLIC_API_TIMEOUT_MS: readNumber("NEXT_PUBLIC_API_TIMEOUT_MS", 10000),
  // NOTE: Temporary override to force DEV websocket endpoints for all environments.
  // TODO: Revert to env-first resolution:
  //   NEXT_PUBLIC_WS_CHAT_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_CHAT_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "chat"),
  //   NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "notification"),
  NEXT_PUBLIC_WS_CHAT_BASE_URL: getWebSocketUrl(apiBaseUrl, "chat"),
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: getWebSocketUrl(apiBaseUrl, "notification"),
  // 환경별 OAuth Client ID 자동 선택
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: getOAuthClientId(googleClientIdDev, googleClientIdProd, googleClientIdFallback),
  NEXT_PUBLIC_KAKAO_REST_API_KEY: getOAuthClientId(kakaoRestApiKeyDev, kakaoRestApiKeyProd, kakaoRestApiKeyFallback),
  NEXT_PUBLIC_NAVER_CLIENT_ID: getOAuthClientId(naverClientIdDev, naverClientIdProd, naverClientIdFallback),
};


