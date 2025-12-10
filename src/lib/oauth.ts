"use client";

import { env } from "./env";
import {
  cleanupSessionBeforeLogin,
  startOAuthFlow,
  debugLog,
} from "./auth-utils";

export type OAuthProvider = "google" | "kakao" | "naver";

function getCurrentOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/**
 * 현재 환경이 프로덕션인지 확인합니다.
 * 도메인 기반으로 판단합니다.
 */
function isProductionEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".talkgate.im") || host === "talkgate.im";
}

/**
 * 환경에 맞는 OAuth Client ID를 가져옵니다.
 * 런타임에 환경을 확인하여 적절한 값을 선택합니다.
 */
function getOAuthClientId(
  provider: OAuthProvider
): string | undefined {
  const isProd = isProductionEnvironment();

  if (provider === "google") {
    // 환경 변수에서 직접 읽기 (NEXT_PUBLIC_은 클라이언트에서 접근 가능)
    if (isProd) {
      return (
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_PROD ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      );
    } else {
      return (
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      );
    }
  }

  if (provider === "kakao") {
    if (isProd) {
      return (
        process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY_PROD ||
        process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ||
        env.NEXT_PUBLIC_KAKAO_REST_API_KEY
      );
    } else {
      return (
        process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY_DEV ||
        process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ||
        env.NEXT_PUBLIC_KAKAO_REST_API_KEY
      );
    }
  }

  if (provider === "naver") {
    if (isProd) {
      return (
        process.env.NEXT_PUBLIC_NAVER_CLIENT_ID_PROD ||
        process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ||
        env.NEXT_PUBLIC_NAVER_CLIENT_ID
      );
    } else {
      return (
        process.env.NEXT_PUBLIC_NAVER_CLIENT_ID_DEV ||
        process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ||
        env.NEXT_PUBLIC_NAVER_CLIENT_ID
      );
    }
  }

  return undefined;
}

/**
 * OAuth 제공자의 인증 URL을 생성합니다.
 */
export function buildOAuthAuthorizeUrl(provider: OAuthProvider): string {
  const origin = getCurrentOrigin();
  const redirectUri = `${origin}/auth/callback/${provider}`;

  if (provider === "google") {
    const clientId = getOAuthClientId("google") || "";
    const scope = encodeURIComponent("openid email profile");
    const state = encodeURIComponent("google");
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  }

  if (provider === "kakao") {
    const clientId = getOAuthClientId("kakao") || "";
    const state = encodeURIComponent("kakao");
    return `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  if (provider === "naver") {
    const clientId = getOAuthClientId("naver") || "";
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
  const clientId = getOAuthClientId(provider);
  if (!clientId) {
    const isProd = isProductionEnvironment();
    const envSuffix = isProd ? "_PROD" : "_DEV";
    const errorMsg = `❌ ${provider.toUpperCase()} Client ID가 설정되지 않았습니다. 환경변수 NEXT_PUBLIC_${provider.toUpperCase()}_${provider === "kakao" ? "REST_API_KEY" : "CLIENT_ID"}${envSuffix} 또는 NEXT_PUBLIC_${provider.toUpperCase()}_${provider === "kakao" ? "REST_API_KEY" : "CLIENT_ID"}를 확인하세요.`;
    debugLog(errorMsg);
    console.error(`[OAuth] ${errorMsg}`);
    alert(`소셜 로그인 설정 오류: ${provider} Client ID가 누락되었습니다.`);
    return;
  }

  debugLog(`🔗 리디렉션 URL 생성 완료`, { url: url.substring(0, 100) + "..." });

  // 5. OAuth 제공자로 리디렉션
  window.location.href = url;
}


