"use client";

import { env } from "./env";
import { getMainDomain } from "./subdomain";
import {
  cleanupSessionBeforeLogin,
  startOAuthFlow,
  debugLog,
} from "./auth-utils";
import { showErrorModal } from "./errorModalEvents";

export type OAuthProvider = "google" | "kakao" | "naver";

/**
 * 현재 환경의 메인 도메인 origin을 반환합니다.
 * 서브도메인이 있는 경우 서브도메인을 제거하고 메인 도메인만 사용합니다.
 * 소셜 로그인 callback URL 검증 오류를 방지하기 위해 필요합니다.
 * 
 * localhost 환경에서는 항상 현재 origin을 사용합니다.
 */
function getCurrentOrigin(): string {
  if (typeof window === "undefined") return "";
  
  // localhost 환경을 먼저 체크 (환경변수보다 우선)
  // localhost에서는 항상 현재 origin을 사용해야 함
  const currentHost = window.location.host;
  const isLocalhost = 
    currentHost.includes("localhost") || 
    currentHost.includes("127.0.0.1") ||
    /^\d+\.\d+\.\d+\.\d+/.test(currentHost.split(":")[0]);
  
  if (isLocalhost) {
    return window.location.origin;
  }
  
  // localhost가 아닌 경우에만 환경변수 또는 getMainDomain() 사용
  // NEXT_PUBLIC_SITE_URL 환경변수가 있으면 우선 사용
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      // URL 파싱 실패 시 그대로 사용
      return siteUrl;
    }
  }
  
  // 환경변수가 없으면 getMainDomain()을 사용하여 메인 도메인 추출
  const protocol = window.location.protocol;
  const mainDomain = getMainDomain();
  
  // 메인 도메인으로 origin 생성 (포트 포함)
  const port = window.location.port ? `:${window.location.port}` : "";
  return `${protocol}//${mainDomain}${port}`;
}

/**
 * OAuth 제공자의 인증 URL을 생성합니다.
 * @param provider - OAuth 제공자
 * @param returnUrl - 로그인 후 리디렉션할 URL (선택사항)
 */
export function buildOAuthAuthorizeUrl(provider: OAuthProvider, returnUrl?: string | null): string {
  const origin = getCurrentOrigin();
  const redirectUri = `${origin}/auth/callback/${provider}`;

  // state 파라미터에 provider와 returnUrl을 JSON으로 인코딩
  const stateData: { provider: string; returnUrl?: string } = { provider };
  if (returnUrl) {
    stateData.returnUrl = returnUrl;
  }
  const state = encodeURIComponent(JSON.stringify(stateData));

  if (provider === "google") {
    const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const scope = encodeURIComponent("openid email profile");
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  }

  if (provider === "kakao") {
    const clientId = env.NEXT_PUBLIC_KAKAO_REST_API_KEY || "";
    return `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  if (provider === "naver") {
    const clientId = env.NEXT_PUBLIC_NAVER_CLIENT_ID || "";
    return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  return origin;
}

export function getCallbackUrl(provider: OAuthProvider): string {
  const origin = getCurrentOrigin();
  return `${origin}/auth/callback/${provider}`;
}

/**
 * 소셜 로그인을 시작합니다.
 * 기존 세션을 정리하고 OAuth 제공자로 리디렉션합니다.
 * 
 * @param provider - OAuth 제공자 (google, kakao, naver)
 * @param returnUrl - 로그인 후 리디렉션할 URL (선택사항)
 * @returns 리디렉션이 수행되므로 이 함수는 반환되지 않습니다.
 */
export function initiateSocialLogin(provider: OAuthProvider, returnUrl?: string | null): void {
  if (typeof window === "undefined") return;

  debugLog(`🔑 소셜 로그인 초기화: ${provider}`, { hasReturnUrl: !!returnUrl });

  // ✅ 일부 OAuth 제공자에서 state가 누락/변형되는 케이스 대비:
  // 콜백 페이지(`OAuthCallbackContent`)는 state 우선, sessionStorage fallback을 지원하므로
  // 소셜 로그인 시작 시 returnUrl을 sessionStorage에도 백업해 둔다.
  try {
    if (returnUrl) {
      window.sessionStorage.setItem("tg_redirect_url", returnUrl);
      debugLog("💾 returnUrl을 sessionStorage에 백업 (state fallback)", {
        returnUrlPreview: returnUrl.slice(0, 120),
      });
    }
  } catch {
    // sessionStorage 접근 불가 환경에서는 무시 (state로만 동작)
  }

  // 1. 기존 세션 데이터 정리 (토큰, 프로젝트 ID 등)
  cleanupSessionBeforeLogin();

  // 2. 디버그 플로우 시작 (sessionStorage에 로깅)
  startOAuthFlow(provider);

  // 3. OAuth URL 생성 (returnUrl을 state에 포함)
  const url = buildOAuthAuthorizeUrl(provider, returnUrl);

  // 4. 환경변수 유효성 검증
  const clientIdMap: Record<OAuthProvider, string | undefined> = {
    google: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    kakao: env.NEXT_PUBLIC_KAKAO_REST_API_KEY,
    naver: env.NEXT_PUBLIC_NAVER_CLIENT_ID,
  };

  const clientId = clientIdMap[provider];
  if (!clientId) {
    const errorMsg = `❌ ${provider.toUpperCase()} Client ID가 설정되지 않았습니다. (Vercel: Environment Variables 설정 후 반드시 재배포 필요)`;
    debugLog(errorMsg);
    console.error(`[OAuth] ${errorMsg}`);
    showErrorModal({
      type: "error",
      headline: "소셜 로그인을 사용할 수 없습니다. 관리자에게 문의해 주세요.",
      hideCancel: true,
    });
    return;
  }

  debugLog(`🔗 리디렉션 URL 생성 완료`, { url: url.substring(0, 100) + "..." });

  // 5. OAuth 제공자로 리디렉션
  window.location.href = url;
}


