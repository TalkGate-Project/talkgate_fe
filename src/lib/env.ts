// Centralized environment variables with minimal runtime validation
// Use NEXT_PUBLIC_* for client-side. Server-only vars should not be imported in the client bundle.

export type AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_API_TIMEOUT_MS: number; // integer milliseconds
  NEXT_PUBLIC_WS_CHAT_BASE_URL?: string; // WebSocket URL for chat namespace
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL?: string; // WebSocket URL for notification namespace
  NEXT_PUBLIC_WS_TEAM_CHAT_BASE_URL?: string; // WebSocket URL for team-chat namespace
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
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  /**
   * 사이트 기본 URL (서브도메인 제외)
   * Instagram OAuth 콜백 URI 생성 및 메인 도메인 추출에 사용
   * 
   * 예시:
   * - 프로덕션: https://app.talkgate.im
   * - 개발: https://app-dev.talkgate.im
   * - 로컬: http://localhost:3000
   * 
   * 환경변수를 참조하지 못한 경우 기본값은 app-dev.talkgate.im입니다.
   */
  NEXT_PUBLIC_SITE_URL?: string;
  /**
   * 랜딩 페이지 베이스 URL
   * 플랜 변경 등 랜딩 페이지로 리다이렉트할 때 사용
   * 
   * 예시:
   * - 프로덕션: https://talkgate.im
   * - 개발: https://dev.talkgate.im
   * 
   * 환경변수를 참조하지 못한 경우 기본값은 https://talkgate.im입니다.
   */
  NEXT_PUBLIC_LANDING_URL?: string;
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

/**
 * NEXT_PUBLIC_SITE_URL에서 메인 도메인을 추출합니다.
 * 프로토콜(http://, https://)과 포트를 제거하여 도메인만 반환합니다.
 * 
 * @param siteUrl NEXT_PUBLIC_SITE_URL 값 (예: "https://app.talkgate.im")
 * @returns 메인 도메인 (예: "app.talkgate.im")
 */
function extractMainDomainFromSiteUrl(siteUrl: string | undefined): string {
  if (!siteUrl) return "app-dev.talkgate.im";
  
  try {
    const url = new URL(siteUrl);
    // 포트가 기본 포트(80, 443)가 아니면 포함
    const port = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";
    return `${url.hostname}${port}`;
  } catch {
    // URL 파싱 실패 시 문자열에서 프로토콜만 제거
    return siteUrl.replace(/^https?:\/\//, "").split("/")[0];
  }
}

// Read API base URL first
// 정적으로 환경 변수 읽기 (Next.js가 빌드 시점에 인라인)
// 환경 변수를 참조하지 못한 경우 app-dev.talkgate.im으로 폴백
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-dev.talkgate.im";

// Next.js는 NEXT_PUBLIC_ 환경 변수를 빌드 시점에 인라인합니다.
// 중요: 동적 접근 (process.env[key])은 인라인되지 않으므로, 정적으로 접근해야 합니다.

// 정적으로 환경 변수 읽기 (Next.js가 빌드 시점에 인라인)
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined;
const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || undefined;
const naverClientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || undefined;
const instagramClientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || undefined;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || undefined;
const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || undefined;
const apiTimeoutMsRaw = process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
const apiTimeoutMsParsed = Number(apiTimeoutMsRaw);
const apiTimeoutMs =
  apiTimeoutMsRaw && Number.isFinite(apiTimeoutMsParsed)
    ? apiTimeoutMsParsed
    : 30000;
// NEXT_PUBLIC_SITE_URL에서 메인 도메인 추출
// 환경변수를 참조하지 못한 경우 app-dev.talkgate.im으로 폴백
const mainDomain = extractMainDomainFromSiteUrl(siteUrl);

export const env: AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  NEXT_PUBLIC_API_TIMEOUT_MS: apiTimeoutMs,
  // NOTE: Temporary override to force DEV websocket endpoints for all environments.
  // TODO: Revert to env-first resolution:
  //   NEXT_PUBLIC_WS_CHAT_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_CHAT_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "chat"),
  //   NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "notification"),
  NEXT_PUBLIC_WS_CHAT_BASE_URL: getWebSocketUrl(apiBaseUrl, "chat"),
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: getWebSocketUrl(apiBaseUrl, "notification"),
  NEXT_PUBLIC_WS_TEAM_CHAT_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_TEAM_CHAT_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "team-chat"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: googleClientId,
  NEXT_PUBLIC_KAKAO_REST_API_KEY: kakaoClientId,
  NEXT_PUBLIC_NAVER_CLIENT_ID: naverClientId,
  NEXT_PUBLIC_INSTAGRAM_CLIENT_ID: instagramClientId,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: gaMeasurementId,
  NEXT_PUBLIC_SITE_URL: siteUrl,
  NEXT_PUBLIC_LANDING_URL: landingUrl,
};

/**
 * NEXT_PUBLIC_SITE_URL에서 추출한 메인 도메인을 반환합니다.
 * 환경변수를 참조하지 못한 경우 app-dev.talkgate.im으로 폴백합니다.
 */
export function getMainDomain(): string {
  return mainDomain;
}

/**
 * 서버 프록시가 백엔드에 원본 클라이언트 IP를 전달할 때 사용하는 공유 비밀키입니다.
 * 브라우저에서 호출하거나 NEXT_PUBLIC 환경 변수로 노출하지 않습니다.
 */
export function getClientIpProxySecret(): string {
  if (typeof window !== "undefined") {
    throw new Error("CLIENT_IP_PROXY_SECRET is server-only");
  }

  const secret = process.env.CLIENT_IP_PROXY_SECRET;
  if (!secret) {
    throw new Error("Missing environment variable: CLIENT_IP_PROXY_SECRET");
  }

  return secret;
}


