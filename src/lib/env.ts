// Centralized environment variables with minimal runtime validation
// Use NEXT_PUBLIC_* for client-side. Server-only vars should not be imported in the client bundle.

export type AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_API_TIMEOUT_MS: number; // integer milliseconds
  NEXT_PUBLIC_WS_CHAT_BASE_URL?: string; // WebSocket URL for chat namespace
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL?: string; // WebSocket URL for notification namespace
  NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
  NEXT_PUBLIC_KAKAO_REST_API_KEY?: string; // Kakao calls it REST API Key
  NEXT_PUBLIC_NAVER_CLIENT_ID?: string;
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
const apiBaseUrl = readString(
  "NEXT_PUBLIC_API_BASE_URL",
  process.env.NODE_ENV === "production" ? "https://api.talkgate.im" : "https://api-dev.talkgate.im"
);

export const env: AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  NEXT_PUBLIC_API_TIMEOUT_MS: readNumber("NEXT_PUBLIC_API_TIMEOUT_MS", 10000),
  NEXT_PUBLIC_WS_CHAT_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_CHAT_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "chat"),
  NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL: readOptionalString("NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL") ?? getWebSocketUrl(apiBaseUrl, "notification"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: readOptionalString("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
  NEXT_PUBLIC_KAKAO_REST_API_KEY: readOptionalString("NEXT_PUBLIC_KAKAO_REST_API_KEY"),
  NEXT_PUBLIC_NAVER_CLIENT_ID: readOptionalString("NEXT_PUBLIC_NAVER_CLIENT_ID"),
};


