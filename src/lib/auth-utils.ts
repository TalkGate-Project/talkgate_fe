"use client";

import { clearTokens } from "./token";
import { clearSelectedProjectId, clearUseAttendanceMenu } from "./project";
import { clearPendingInviteToken } from "./invite";

/**
 * ============================================================================
 * 🔐 Auth Session Utilities
 * ============================================================================
 * 소셜 로그인 전/후 세션 관리 및 디버깅을 위한 유틸리티 함수 모음
 */

const DEBUG_LOG_KEY = "tg_auth_debug_log";
const DEBUG_STATE_KEY = "tg_auth_debug_state";

// ============================================================================
// 🧹 Session Cleanup Functions
// ============================================================================

/**
 * 로그인 시도 전에 기존 세션 데이터를 정리합니다.
 * 소셜 로그인 버튼 클릭 시 호출하여 잔존 데이터로 인한 문제를 방지합니다.
 */
export function cleanupSessionBeforeLogin(): void {
  if (typeof window === "undefined") return;

  debugLog("🧹 세션 정리 시작", { timestamp: new Date().toISOString() });

  try {
    // 1. 토큰 정리 (accessToken, refreshToken 쿠키)
    clearTokens();
    debugLog("✅ 토큰 쿠키 정리 완료");
  } catch (e) {
    debugLog("❌ 토큰 정리 실패", e);
  }

  try {
    // 2. 프로젝트 ID 정리
    clearSelectedProjectId();
    debugLog("✅ 프로젝트 ID 정리 완료");
  } catch (e) {
    debugLog("❌ 프로젝트 ID 정리 실패", e);
  }

  try {
    // 3. 근태 메뉴 설정 정리
    clearUseAttendanceMenu();
    debugLog("✅ 근태 메뉴 설정 정리 완료");
  } catch (e) {
    debugLog("❌ 근태 메뉴 설정 정리 실패", e);
  }

  try {
    // 4. 대기 중인 초대 토큰은 유지 (로그인 후 처리 필요할 수 있음)
    // clearPendingInviteToken(); // 필요시 주석 해제
    debugLog("ℹ️ 초대 토큰은 유지됨");
  } catch (e) {
    debugLog("❌ 초대 토큰 체크 실패", e);
  }

  // 5. 기타 앱 관련 localStorage 항목 정리 (필요에 따라 추가)
  const keysToPreserve = [
    "tg_auto_login", // Remember Me 설정은 유지
    "talkgate-theme", // 테마 설정 유지
    "tg_invite_token", // 초대 토큰 유지
    "tg_invite_info", // 초대 정보 유지 (소셜 로그인 후 초대 수락용)
  ];

  try {
    const tgKeys = Object.keys(window.localStorage).filter(
      (key) => key.startsWith("tg_") && !keysToPreserve.includes(key)
    );
    
    tgKeys.forEach((key) => {
      // 디버그 로그 키는 유지
      if (key === DEBUG_LOG_KEY || key === DEBUG_STATE_KEY) return;
      try {
        window.localStorage.removeItem(key);
        debugLog(`🗑️ localStorage 항목 삭제: ${key}`);
      } catch {
        // localStorage 접근 불가 환경(Private Browsing 등)에서는 무시
      }
    });
  } catch (e) {
    debugLog("❌ localStorage 정리 실패", e);
  }

  debugLog("✅ 세션 정리 완료");
}

/**
 * 완전한 로그아웃 처리 (Header 로그아웃 버튼과 동일)
 */
export function performFullLogout(): void {
  if (typeof window === "undefined") return;

  debugLog("🚪 완전 로그아웃 시작");

  try {
    clearTokens();
    clearSelectedProjectId();
    clearUseAttendanceMenu();
    clearPendingInviteToken();
    
    // 디버그 로그도 정리
    clearDebugLogs();
    
    debugLog("✅ 완전 로그아웃 완료");
  } catch (e) {
    console.error("[Auth] 로그아웃 처리 중 오류:", e);
  }
}

// ============================================================================
// 📝 Debug Logging Functions (리디렉션 간 로그 유지)
// ============================================================================

export interface AuthDebugEntry {
  timestamp: string;
  message: string;
  data?: unknown;
  url?: string;
}

export interface AuthDebugState {
  provider?: string;
  startedAt?: string;
  lastStep?: string;
  error?: string;
}

/**
 * sessionStorage에 디버그 로그를 추가합니다.
 * 리디렉션 후에도 로그가 유지되어 디버깅에 유용합니다.
 */
export function debugLog(message: string, data?: unknown): void {
  if (typeof window === "undefined") return;

  const entry: AuthDebugEntry = {
    timestamp: new Date().toISOString(),
    message,
    data: data ? (typeof data === "object" ? JSON.parse(JSON.stringify(data)) : data) : undefined,
    url: window.location.href,
  };

  // console에도 출력
  console.log(`[AuthDebug] ${message}`, data ?? "");

  try {
    const existing = window.sessionStorage.getItem(DEBUG_LOG_KEY);
    const logs: AuthDebugEntry[] = existing ? JSON.parse(existing) : [];
    
    // 최대 100개 로그 유지
    if (logs.length >= 100) {
      logs.shift();
    }
    
    logs.push(entry);
    window.sessionStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("[AuthDebug] 로그 저장 실패:", e);
  }
}

/**
 * 현재 인증 플로우의 상태를 저장합니다.
 */
export function setDebugState(state: Partial<AuthDebugState>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = window.sessionStorage.getItem(DEBUG_STATE_KEY);
    const currentState: AuthDebugState = existing ? JSON.parse(existing) : {};
    const newState = { ...currentState, ...state };
    window.sessionStorage.setItem(DEBUG_STATE_KEY, JSON.stringify(newState));
    debugLog("🔄 상태 업데이트", newState);
  } catch (e) {
    console.error("[AuthDebug] 상태 저장 실패:", e);
  }
}

/**
 * 현재 인증 플로우 상태를 가져옵니다.
 */
export function getDebugState(): AuthDebugState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(DEBUG_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    // sessionStorage 접근 불가 또는 JSON 파싱 실패 시 무시
    return null;
  }
}

/**
 * 저장된 디버그 로그를 가져옵니다.
 */
export function getDebugLogs(): AuthDebugEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.sessionStorage.getItem(DEBUG_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    // sessionStorage 접근 불가 또는 JSON 파싱 실패 시 무시
    return [];
  }
}

/**
 * 디버그 로그를 콘솔에 출력합니다 (개발자 도구에서 호출용).
 */
export function printDebugLogs(): void {
  const logs = getDebugLogs();
  const state = getDebugState();

  console.group("🔍 TalkGate Auth Debug Report");
  console.log("📊 현재 상태:", state);
  console.log("📜 로그 내역:");
  logs.forEach((log, i) => {
    console.log(
      `[${i + 1}] ${log.timestamp} - ${log.message}`,
      log.data ?? "",
      log.url ? `\n   URL: ${log.url}` : ""
    );
  });
  console.groupEnd();
}

/**
 * 디버그 로그를 초기화합니다.
 */
export function clearDebugLogs(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(DEBUG_LOG_KEY);
    window.sessionStorage.removeItem(DEBUG_STATE_KEY);
  } catch {
    // sessionStorage 접근 불가 환경에서는 무시
  }
}

/**
 * 소셜 로그인 시작 시 호출합니다.
 */
export function startOAuthFlow(provider: string): void {
  // 기존 디버그 로그 초기화 후 새로 시작
  clearDebugLogs();
  
  setDebugState({
    provider,
    startedAt: new Date().toISOString(),
    lastStep: "started",
    error: undefined,
  });

  debugLog(`🚀 소셜 로그인 시작: ${provider}`, {
    provider,
    currentUrl: window.location.href,
    cookies: document.cookie.split(";").map((c) => c.trim().split("=")[0]),
  });
}

/**
 * OAuth 콜백 도착 시 호출합니다.
 */
export function markOAuthCallback(provider: string, hasCode: boolean): void {
  setDebugState({
    lastStep: hasCode ? "callback_with_code" : "callback_without_code",
  });

  debugLog(`📥 OAuth 콜백 도착: ${provider}`, {
    hasCode,
    searchParams: window.location.search,
  });
}

/**
 * 로그인 성공 시 호출합니다.
 */
export function markLoginSuccess(provider: string, hasProjectId: boolean): void {
  setDebugState({
    lastStep: "login_success",
  });

  debugLog(`✅ 로그인 성공: ${provider}`, {
    hasProjectId,
    redirectTo: hasProjectId ? "/dashboard" : "/projects",
  });
}

/**
 * 로그인 실패 시 호출합니다.
 */
export function markLoginError(provider: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  setDebugState({
    lastStep: "login_error",
    error: errorMessage,
  });

  debugLog(`❌ 로그인 실패: ${provider}`, {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });
}

// 개발자 도구 콘솔에서 쉽게 접근할 수 있도록 전역에 노출
if (typeof window !== "undefined") {
  (window as any).tgAuthDebug = {
    printLogs: printDebugLogs,
    getLogs: getDebugLogs,
    getState: getDebugState,
    clearLogs: clearDebugLogs,
  };
}

