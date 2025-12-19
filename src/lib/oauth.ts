"use client";

import { env } from "./env";
import {
  cleanupSessionBeforeLogin,
  startOAuthFlow,
  debugLog,
} from "./auth-utils";
import { showErrorModal } from "./errorModalEvents";

export type OAuthProvider = "google" | "kakao" | "naver";

function getCurrentOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/**
 * OAuth 제공자의 인증 URL을 생성합니다.
 */
export function buildOAuthAuthorizeUrl(provider: OAuthProvider): string {
  const origin = getCurrentOrigin();
  const redirectUri = `${origin}/auth/callback/${provider}`;

  if (provider === "google") {
    const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const scope = encodeURIComponent("openid email profile");
    const state = encodeURIComponent("google");
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  }

  if (provider === "kakao") {
    const clientId = env.NEXT_PUBLIC_KAKAO_REST_API_KEY || "";
    const state = encodeURIComponent("kakao");
    return `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  if (provider === "naver") {
    const clientId = env.NEXT_PUBLIC_NAVER_CLIENT_ID || "";
    const state = encodeURIComponent("naver");
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
 * @returns 리디렉션이 수행되므로 이 함수는 반환되지 않습니다.
 */
export function initiateSocialLogin(provider: OAuthProvider): void {
  if (typeof window === "undefined") return;

  debugLog(`🔑 소셜 로그인 초기화: ${provider}`);

  // 1. 기존 세션 데이터 정리 (토큰, 프로젝트 ID 등)
  cleanupSessionBeforeLogin();

  // 2. 디버그 플로우 시작 (sessionStorage에 로깅)
  startOAuthFlow(provider);

  // 3. OAuth URL 생성
  const url = buildOAuthAuthorizeUrl(provider);

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


