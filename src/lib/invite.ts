"use client";

const INVITE_TOKEN_KEY = "tg_invite_token";

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


