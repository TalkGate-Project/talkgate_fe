import { getAccessToken, getRefreshToken } from "./token";

export type AuthSessionStatus = "unknown" | "active" | "expired";

type Listener = (status: AuthSessionStatus) => void;

let currentStatus: AuthSessionStatus = "unknown";
const listeners = new Set<Listener>();

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
  if (currentStatus === "expired") return;
  currentStatus = "expired";
  notify();
}

export function resetAuthSession(): void {
  if (currentStatus === "unknown") return;
  currentStatus = "unknown";
  notify();
}
