"use client";

// Simple token manager storing tokens in browser cookies (client-side)
// NOTE: Tokens in non-HttpOnly cookies can be read by JS. Use only as required for this app's policy.

export type Tokens = { accessToken?: string | null; refreshToken?: string | null };

const ACCESS_COOKIE = "tg_access_token";
const REFRESH_COOKIE = "tg_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function buildCookieAttributes(): string {
  const attrs: string[] = ["Path=/", "SameSite=Lax"]; // sensible defaults for dev
  if (process.env.NODE_ENV === "production") {
    // For cross-site scenarios in prod, set None; Secure as needed
    // If app and API are same-site, Lax is fine; keeping None; Secure allows broader usage
    return ["Path=/", "SameSite=None", "Secure"].join("; ");
  }
  return attrs.join("; ");
}

export function setTokens(tokens: Tokens): void {
  if (!isBrowser()) return;
  const attrs = buildCookieAttributes();
  if (tokens.accessToken !== undefined) {
    if (tokens.accessToken) document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(tokens.accessToken)}; ${attrs}`;
    else document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; ${attrs}`;
  }
  if (tokens.refreshToken !== undefined) {
    if (tokens.refreshToken) document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(tokens.refreshToken)}; ${attrs}`;
    else document.cookie = `${REFRESH_COOKIE}=; Max-Age=0; ${attrs}`;
  }
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


