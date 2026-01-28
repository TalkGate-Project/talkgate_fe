"use client";

import { useSyncExternalStore } from "react";
import {
  getAuthSessionStatus,
  subscribeAuthSession,
  hasAuthTokenHint,
  setAuthSessionActive,
  setAuthSessionExpired,
  resetAuthSession,
} from "@/lib/authSession";

export function useAuthSession() {
  const status = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionStatus,
    getAuthSessionStatus
  );

  return {
    status,
    hasAuthTokenHint: hasAuthTokenHint(),
    setActive: setAuthSessionActive,
    setExpired: setAuthSessionExpired,
    reset: resetAuthSession,
  } as const;
}
