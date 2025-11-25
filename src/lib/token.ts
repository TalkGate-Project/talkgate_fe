"use client";

// Simple token manager storing tokens in browser cookies (client-side)
// NOTE: Tokens in non-HttpOnly cookies can be read by JS. Use only as required for this app's policy.

export type Tokens = { accessToken?: string | null; refreshToken?: string | null };

const ACCESS_COOKIE = "tg_access_token";
const REFRESH_COOKIE = "tg_refresh_token";
const REMEMBER_KEY = "tg_auto_login"; // localStorage flag for persistent login

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function buildCookieAttributes(persistent: boolean): string {
  console.log("[Token] 🍪 buildCookieAttributes 호출:", { persistent, env: process.env.NODE_ENV });
  
  const attrs: string[] = ["Path=/", "SameSite=Lax"]; // sensible defaults for dev
  if (persistent) {
    // 30 days
    attrs.push(`Max-Age=${60 * 60 * 24 * 30}`);
    console.log("[Token] ✅ Max-Age 30일 설정됨 (영구 쿠키)");
  } else {
    console.log("[Token] ⚠️ Max-Age 미설정 (세션 쿠키 - 브라우저 종료 시 삭제됨)");
  }
  if (process.env.NODE_ENV === "production") {
    // For cross-site scenarios in prod, set None; Secure as needed
    // If app and API are same-site, Lax is fine; keeping None; Secure allows broader usage
    const base = ["Path=/", "SameSite=None", "Secure"] as string[];
    if (persistent) base.push(`Max-Age=${60 * 60 * 24 * 30}`);
    console.log("[Token] 🔐 Production 쿠키 속성:", base.join("; "));
    return base.join("; ");
  }
  console.log("[Token] 🔧 Development 쿠키 속성:", attrs.join("; "));
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
  
  console.log("[Token] 🔑 setTokens 호출됨");
  console.log("[Token] 📊 토큰 정보:", {
    hasAccessToken: !!tokens.accessToken,
    hasRefreshToken: !!tokens.refreshToken,
    accessTokenPreview: tokens.accessToken ? tokens.accessToken.slice(0, 20) + "..." : null,
  });
  
  const rememberMe = getRememberMePreference();
  console.log("[Token] 🔄 Remember Me 설정 확인:", rememberMe);
  
  const attrs = buildCookieAttributes(rememberMe);
  console.log("[Token] 🍪 최종 쿠키 속성:", attrs);
  
  if (tokens.accessToken !== undefined) {
    if (tokens.accessToken) {
      document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(tokens.accessToken)}; ${attrs}`;
      console.log("[Token] ✅ Access Token 쿠키 저장 완료");
    } else {
      document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; ${attrs}`;
      console.log("[Token] 🗑️ Access Token 쿠키 삭제");
    }
  }
  if (tokens.refreshToken !== undefined) {
    if (tokens.refreshToken) {
      document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(tokens.refreshToken)}; ${attrs}`;
      console.log("[Token] ✅ Refresh Token 쿠키 저장 완료");
    } else {
      document.cookie = `${REFRESH_COOKIE}=; Max-Age=0; ${attrs}`;
      console.log("[Token] 🗑️ Refresh Token 쿠키 삭제");
    }
  }
  
  // 저장 후 쿠키 상태 확인
  console.log("[Token] 📋 현재 쿠키 상태:", document.cookie);
}

export function clearTokens(): void {
  setTokens({ accessToken: null, refreshToken: null });
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


