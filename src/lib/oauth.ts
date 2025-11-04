"use client";

import { env } from "./env";

export type OAuthProvider = "google" | "kakao" | "naver";

function getCurrentOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

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


