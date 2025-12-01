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
 * 쿠키 속성을 생성합니다.
 * 도메인은 명시하지 않고 Path=/만 사용하여 현재 도메인에 자동 설정되도록 합니다.
 * (브라우저가 현재 호스트를 기준으로 자동 처리)
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
  } else {
    attrs.push("SameSite=Lax");
  }
  
  return attrs.join("; ");
}

export function setRememberMePreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    console.log("[Token] 💾 setRememberMePreference:", enabled);
    window.localStorage.setItem(REMEMBER_KEY, enabled ? "1" : "0");
  } catch (e) {
    console.error("[Token] ❌ setRememberMePreference 실패:", e);
  }
}

export function getRememberMePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = window.localStorage.getItem(REMEMBER_KEY) === "1";
    console.log("[Token] 📖 getRememberMePreference:", value);
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
 * Path=/만 사용하여 현재 도메인의 쿠키를 삭제합니다.
 */
export function clearTokens(): void {
  if (!isBrowser()) return;
  
  // 간단하게 Max-Age=0, Path=/로 삭제
  document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; Path=/`;
  document.cookie = `${REFRESH_COOKIE}=; Max-Age=0; Path=/`;
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


