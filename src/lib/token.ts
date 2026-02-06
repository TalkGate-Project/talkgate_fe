"use client";

// Simple token manager storing tokens in browser cookies (client-side)
// NOTE: Tokens in non-HttpOnly cookies can be read by JS. Use only as required for this app's policy.
// NOTE: 상세한 쿠키 보안 설정(HttpOnly, Secure 등)은 백엔드에서 Set-Cookie 헤더로 처리하는 것이 바람직합니다.

export type Tokens = { accessToken?: string | null; refreshToken?: string | null };

const ACCESS_COOKIE = "tg_access_token";
const REFRESH_COOKIE = "tg_refresh_token";
const REMEMBER_KEY = "tg_auto_login"; // localStorage flag for persistent login

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * 현재 호스트가 프로덕션 도메인인지 확인합니다.
 */
function isProductionDomain(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".talkgate.im") || host === "talkgate.im";
}

/**
 * 쿠키 속성을 생성합니다.
 * 프로덕션 환경(.talkgate.im)에서는 Domain 속성을 명시하여 서브도메인 간 쿠키 공유를 지원합니다.
 * 개발 환경에서는 도메인을 명시하지 않고 현재 도메인에 자동 설정됩니다.
 */
function buildCookieAttributes(persistent: boolean): string {
  const attrs: string[] = ["Path=/"];
  
  if (persistent) {
    // 30 days
    attrs.push(`Max-Age=${60 * 60 * 24 * 30}`);
  }
  
  // HTTPS 환경에서는 SameSite=None; Secure 사용 (크로스 사이트 요청 지원)
  // HTTP 환경(localhost)에서는 SameSite=Lax 사용
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attrs.push("SameSite=None");
    attrs.push("Secure");
    
    // 프로덕션 도메인에서는 Domain 속성을 명시하여 서브도메인 간 쿠키 공유
    // 예: landing.talkgate.im과 talkgate.im 간 쿠키 공유
    if (isProductionDomain()) {
      attrs.push("Domain=.talkgate.im");
    }
  } else {
    attrs.push("SameSite=Lax");
  }
  
  return attrs.join("; ");
}

export function setRememberMePreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMEMBER_KEY, enabled ? "1" : "0");
  } catch (e) {
    console.error("[Token] ❌ setRememberMePreference 실패:", e);
  }
}

export function getRememberMePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = window.localStorage.getItem(REMEMBER_KEY) === "1";
    return value;
  } catch {
    return false;
  }
}

export function setTokens(tokens: Tokens): void {
  if (!isBrowser()) return;
  
  const rememberMe = getRememberMePreference();
  const attrs = buildCookieAttributes(rememberMe);
  
  if (tokens.accessToken !== undefined) {
    if (tokens.accessToken) {
      document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(tokens.accessToken)}; ${attrs}`;
    } else {
      // 삭제 시에는 Max-Age=0, Path=/만 사용
      document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; Path=/`;
    }
  }
  if (tokens.refreshToken !== undefined) {
    if (tokens.refreshToken) {
      document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(tokens.refreshToken)}; ${attrs}`;
    } else {
      document.cookie = `${REFRESH_COOKIE}=; Max-Age=0; Path=/`;
    }
  }
}

/**
 * 토큰 쿠키를 삭제합니다.
 * 프로덕션 환경에서는 Domain 속성도 명시하여 서브도메인 간 쿠키를 완전히 삭제합니다.
 */
export function clearTokens(): void {
  if (!isBrowser()) return;
  
  const attrs: string[] = ["Max-Age=0", "Path=/"];
  
  // HTTPS 환경에서는 Secure 속성 추가
  if (window.location.protocol === "https:") {
    attrs.push("Secure");
    
    // 프로덕션 도메인에서는 Domain 속성도 명시
    if (isProductionDomain()) {
      attrs.push("Domain=.talkgate.im");
    }
  }
  
  const attrString = attrs.join("; ");
  document.cookie = `${ACCESS_COOKIE}=; ${attrString}`;
  document.cookie = `${REFRESH_COOKIE}=; ${attrString}`;
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ACCESS_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFRESH_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}


