"use client";

/** 초대 토큰 저장 키 */
const INVITE_TOKEN_KEY = "tg_invite_token";
/** 초대 정보 저장 키 */
const INVITE_INFO_KEY = "tg_invite_info";

/**
 * 초대 정보 타입 (/v1/members/invitations/verify 응답 기반)
 */
export type PendingInviteInfo = {
  // 필수 필드
  token: string;
  email: string;
  projectName: string;
  projectId: number;
  // 선택 필드 (invitation 객체에서 가져옴)
  id?: number;
  role?: "admin" | "subAdmin" | "leader" | "member" | string;
  status?: "pending" | "accepted" | "expired" | string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // 초대자 정보 (있는 경우)
  inviterName?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function savePendingInviteToken(token: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(INVITE_TOKEN_KEY, token);
  } catch {}
}

export function getPendingInviteToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(INVITE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInviteToken() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(INVITE_TOKEN_KEY);
  } catch {}
}

/**
 * 초대 정보 전체를 localStorage에 저장
 */
export function savePendingInviteInfo(info: PendingInviteInfo) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(INVITE_INFO_KEY, JSON.stringify(info));
    // 토큰도 함께 저장 (호환성)
    window.localStorage.setItem(INVITE_TOKEN_KEY, info.token);
  } catch {}
}

/**
 * 저장된 초대 정보 조회
 */
export function getPendingInviteInfo(): PendingInviteInfo | null {
  if (!isBrowser()) return null;
  try {
    const stored = window.localStorage.getItem(INVITE_INFO_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as PendingInviteInfo;
  } catch {
    return null;
  }
}

/**
 * 저장된 초대 정보 및 토큰 모두 삭제
 */
export function clearPendingInviteInfo() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(INVITE_INFO_KEY);
    window.localStorage.removeItem(INVITE_TOKEN_KEY);
  } catch {}
}


