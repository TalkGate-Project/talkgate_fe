"use client";

// Simple token manager storing tokens in browser cookies (client-side)
// NOTE: Tokens in non-HttpOnly cookies can be read by JS. Use only as required for this app's policy.

export type Tokens = { accessToken?: string | null; refreshToken?: string | null };

const ACCESS_COOKIE = "tg_access_token";
const REFRESH_COOKIE = "tg_refresh_token";
const REMEMBER_KEY = "tg_auto_login"; // localStorage flag for persistent login
const MAIN_DOMAIN = "talkgate.im";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * 쿠키 도메인을 반환합니다.
 * 모든 서브도메인에서 쿠키를 공유하기 위해 루트 도메인을 반환합니다.
 */
function getCookieDomain(): string | undefined {
  if (!isBrowser()) return undefined;
  
  const host = window.location.hostname;
  
  // localhost의 경우 domain 설정하지 않음 (브라우저가 자동 처리)
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return undefined;
  }
  
  // 프로덕션: .talkgate.im으로 설정 (앞에 점을 붙여서 모든 서브도메인 포함)
  return `.${MAIN_DOMAIN}`;
}

function buildCookieAttributes(persistent: boolean): string {
  console.log("[Token] 🍪 buildCookieAttributes 호출:", { persistent, env: process.env.NODE_ENV });
  
  const domain = getCookieDomain();
  const domainAttr = domain ? `Domain=${domain}` : "";
  
  const attrs: string[] = ["Path=/", "SameSite=Lax"];
  if (domainAttr) attrs.push(domainAttr);
  
  if (persistent) {
    // 30 days
    attrs.push(`Max-Age=${60 * 60 * 24 * 30}`);
    console.log("[Token] ✅ Max-Age 30일 설정됨 (영구 쿠키)");
  } else {
    console.log("[Token] ⚠️ Max-Age 미설정 (세션 쿠키 - 브라우저 종료 시 삭제됨)");
  }
  if (process.env.NODE_ENV === "production") {
    // For cross-site scenarios in prod, set None; Secure as needed
    const base = ["Path=/", "SameSite=None", "Secure"];
    if (domainAttr) base.push(domainAttr);
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

/**
 * 모든 가능한 도메인 패턴에서 쿠키를 삭제합니다.
 * 서브도메인에서 설정된 쿠키도 확실히 삭제하기 위해 여러 패턴을 시도합니다.
 */
export function clearTokens(): void {
  if (!isBrowser()) return;
  
  console.log("[Token] 🗑️ clearTokens 호출 - 모든 도메인 패턴에서 쿠키 삭제 시도");
  
  const host = window.location.hostname;
  
  // 삭제할 도메인 패턴들 (우선순위 순)
  const domainsToTry: (string | undefined)[] = [
    undefined,                    // 현재 호스트 (도메인 속성 없음)
    `.${MAIN_DOMAIN}`,           // .talkgate.im (루트 도메인)
    MAIN_DOMAIN,                 // talkgate.im
  ];
  
  // 현재 호스트가 서브도메인인 경우 해당 도메인도 추가
  if (host !== "localhost" && host !== "127.0.0.1" && host.endsWith(`.${MAIN_DOMAIN}`)) {
    domainsToTry.push(host);
    domainsToTry.push(`.${host}`);
  }
  
  // 각 쿠키에 대해 모든 도메인 패턴으로 삭제 시도
  [ACCESS_COOKIE, REFRESH_COOKIE].forEach((cookieName) => {
    domainsToTry.forEach((domain) => {
      const domainAttr = domain ? `Domain=${domain};` : "";
      // Path=/만 사용하여 삭제 (다른 속성은 삭제에 영향 없음)
      document.cookie = `${cookieName}=; Max-Age=0; Path=/; ${domainAttr}`;
      // Secure 속성이 있었을 수 있으므로 Secure도 포함하여 삭제
      document.cookie = `${cookieName}=; Max-Age=0; Path=/; ${domainAttr} Secure;`;
      // SameSite=None과 함께 삭제 시도
      document.cookie = `${cookieName}=; Max-Age=0; Path=/; ${domainAttr} SameSite=None; Secure;`;
      document.cookie = `${cookieName}=; Max-Age=0; Path=/; ${domainAttr} SameSite=Lax;`;
    });
    console.log(`[Token] ✅ ${cookieName} 쿠키 삭제 시도 완료`);
  });
  
  // 삭제 후 상태 확인
  console.log("[Token] 📋 삭제 후 쿠키 상태:", document.cookie);
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


