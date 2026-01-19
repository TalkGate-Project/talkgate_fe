// Centralized environment variables with minimal runtime validation
// Use NEXT_PUBLIC_* for client-side. Server-only vars should not be imported in the client bundle.

export type AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_API_TIMEOUT_MS: number; // integer milliseconds
  NEXT_PUBLIC_WS_CHAT_BASE_URL?: string; // WebSocket URL for chat namespace
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL?: string; // WebSocket URL for notification namespace
  NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
  /**
   * Kakao OAuth Client ID (Kakao Console: REST API Key)
   * 
   * Redirect URI:
   * - 프로덕션: https://app.talkgate.im/auth/callback/kakao
   * - 개발: https://app-dev.talkgate.im/auth/callback/kakao, http://localhost:3000/auth/callback/kakao
   */
  NEXT_PUBLIC_KAKAO_REST_API_KEY?: string;
  NEXT_PUBLIC_NAVER_CLIENT_ID?: string;
  /**
   * Instagram OAuth Client ID (Facebook App ID)
   * 
   * Redirect URI:
   * - 프로덕션: https://app.talkgate.im/instagram/callback
   * - 개발: https://app-dev.talkgate.im/instagram/callback, http://localhost:3000/instagram/callback
   */
  NEXT_PUBLIC_INSTAGRAM_CLIENT_ID?: string;
  /**
   * 사이트 기본 URL (서브도메인 제외)
   * Instagram OAuth 콜백 URI 생성에 사용
   * 
   * 예시:
   * - 프로덕션: https://app.talkgate.im
   * - 개발: https://app-dev.talkgate.im
   * - 로컬: http://localhost:3000
   */
  NEXT_PUBLIC_SITE_URL?: string;
};

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
// 정적으로 환경 변수 읽기 (Next.js가 빌드 시점에 인라인)
// 환경 변수가 없으면 환경에 따라 fallback 사용
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (
  process.env.NODE_ENV === "production" 
    ? "https://api.talkgate.im" 
    : "https://api-dev.talkgate.im"
);

// Next.js는 NEXT_PUBLIC_ 환경 변수를 빌드 시점에 인라인합니다.
// 중요: 동적 접근 (process.env[key])은 인라인되지 않으므로, 정적으로 접근해야 합니다.

// 정적으로 환경 변수 읽기 (Next.js가 빌드 시점에 인라인)
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined;
const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || undefined;
const naverClientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || undefined;
const instagramClientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || undefined;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || undefined;

export const env: AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  NEXT_PUBLIC_API_TIMEOUT_MS: readNumber("NEXT_PUBLIC_API_TIMEOUT_MS", 10000),
  // NOTE: Temporary override to force DEV websocket endpoints for all environments.
  // TODO: Revert to env-first resolution:
  //   NEXT_PUBLIC_WS_CHAT_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_CHAT_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "chat"),
  //   NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "notification"),
  NEXT_PUBLIC_WS_CHAT_BASE_URL: getWebSocketUrl(apiBaseUrl, "chat"),
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: getWebSocketUrl(apiBaseUrl, "notification"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: googleClientId,
  NEXT_PUBLIC_KAKAO_REST_API_KEY: kakaoClientId,
  NEXT_PUBLIC_NAVER_CLIENT_ID: naverClientId,
  NEXT_PUBLIC_INSTAGRAM_CLIENT_ID: instagramClientId,
  NEXT_PUBLIC_SITE_URL: siteUrl,
};


