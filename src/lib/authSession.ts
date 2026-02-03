import { getAccessToken, getRefreshToken } from "./token";

export type AuthSessionStatus = "unknown" | "active" | "expired";

type Listener = (status: AuthSessionStatus) => void;

let currentStatus: AuthSessionStatus = "unknown";
const listeners = new Set<Listener>();

// 로그아웃 진행 중 플래그 - 로그아웃 중에는 세션 만료 처리를 무시
let isLoggingOut = false;

function notify(): void {
  listeners.forEach((listener) => listener(currentStatus));
}

export function getAuthSessionStatus(): AuthSessionStatus {
  return currentStatus;
}

export function subscribeAuthSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasAuthTokenHint(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}

export function setAuthSessionActive(): void {
  if (currentStatus === "active") return;
  currentStatus = "active";
  notify();
}

export function setAuthSessionExpired(_reason?: string): void {
  // 로그아웃 진행 중에는 세션 만료 처리를 무시 (로그아웃 후 모달이 잠깐 뜨는 것 방지)
  if (isLoggingOut) return;
  if (currentStatus === "expired") return;
  currentStatus = "expired";
  notify();
}

export function resetAuthSession(): void {
  if (currentStatus === "unknown") return;
  currentStatus = "unknown";
  notify();
}

/**
 * 로그아웃 진행 중 플래그 설정
 * - true: 로그아웃 시작 시 설정, setAuthSessionExpired 호출이 무시됨
 * - false: 로그아웃 완료 후 또는 새로운 세션 시작 시 해제
 */
export function setLoggingOut(value: boolean): void {
  isLoggingOut = value;
}

export function getIsLoggingOut(): boolean {
  return isLoggingOut;
}
