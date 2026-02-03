"use client";

/**
 * 통합 로그아웃 유틸리티
 * 
 * 모든 로그아웃 경로에서 사용할 수 있는 안전하고 완전한 로그아웃 처리 함수입니다.
 * 
 * 처리 내용:
 * 1. WebSocket 연결 종료 (채팅, 알림)
 * 2. 클라이언트 사이드 상태 정리 (토큰, 프로젝트 ID, 근태 메뉴 등)
 * 3. React Query 캐시 정리 (선택적)
 * 4. 서버로 리다이렉트하여 쿠키 삭제 처리
 * 
 * @param options - 로그아웃 옵션
 * @param options.redirectUrl - 로그아웃 후 이동할 URL (기본: /login?logout=success)
 * @param options.queryClient - React Query 클라이언트 (제공 시 캐시 정리)
 * @param options.preserveInviteInfo - 초대 정보 유지 여부 (기본: false)
 */

import { getMainDomain } from "./env";
import { clearTokens } from "./token";
import { clearSelectedProjectId, clearUseAttendanceMenu } from "./project";
import { talkgateSocket } from "./realtime";
import { notificationSocket } from "./notificationSocket";
import { resetAuthSession, setLoggingOut } from "./authSession";
import type { QueryClient } from "@tanstack/react-query";

export interface LogoutOptions {
  redirectUrl?: string;
  queryClient?: QueryClient;
  preserveInviteInfo?: boolean;
}

/**
 * 완전한 로그아웃 처리
 * 
 * 모든 클라이언트 사이드 상태를 정리하고 서버로 리다이렉트하여 쿠키를 삭제합니다.
 * 
 * @example
 * // 기본 사용 (UserMenuDropdown에서)
 * performLogout();
 * 
 * @example
 * // React Query 캐시도 정리
 * performLogout({ queryClient });
 * 
 * @example
 * // 초대 정보 유지하며 로그아웃 (초대 수락 플로우)
 * performLogout({ preserveInviteInfo: true });
 */
export function performLogout(options: LogoutOptions = {}): void {
  if (typeof window === "undefined") {
    console.warn("[Logout] 서버 사이드에서는 로그아웃을 수행할 수 없습니다.");
    return;
  }

  const {
    redirectUrl,
    queryClient,
    preserveInviteInfo = false,
  } = options;

  console.log("[Logout] 🚪 로그아웃 시작", { preserveInviteInfo });

  // 0. 로그아웃 진행 중 플래그 설정 (세션 만료 모달 방지)
  setLoggingOut(true);

  // 1. WebSocket 연결 종료
  // 에러가 발생해도 계속 진행 (로그아웃은 반드시 완료되어야 함)
  try {
    talkgateSocket.disconnect();
    console.log("[Logout] ✅ 채팅 WebSocket 연결 종료");
  } catch (e) {
    console.error("[Logout] ❌ 채팅 WebSocket 종료 실패:", e);
  }

  try {
    notificationSocket.disconnect();
    console.log("[Logout] ✅ 알림 WebSocket 연결 종료");
  } catch (e) {
    console.error("[Logout] ❌ 알림 WebSocket 종료 실패:", e);
  }

  // 2. 클라이언트 사이드 상태 정리
  try {
    clearTokens();
    console.log("[Logout] ✅ 토큰 삭제 완료");
  } catch (e) {
    console.error("[Logout] ❌ 토큰 삭제 실패:", e);
  }
  
  resetAuthSession();

  try {
    clearSelectedProjectId();
    console.log("[Logout] ✅ 프로젝트 ID 삭제 완료");
  } catch (e) {
    console.error("[Logout] ❌ 프로젝트 ID 삭제 실패:", e);
  }

  try {
    clearUseAttendanceMenu();
    console.log("[Logout] ✅ 근태 메뉴 설정 삭제 완료");
  } catch (e) {
    console.error("[Logout] ❌ 근태 메뉴 설정 삭제 실패:", e);
  }

  // 3. React Query 캐시 정리 (제공된 경우)
  if (queryClient) {
    try {
      queryClient.clear();
      console.log("[Logout] ✅ React Query 캐시 정리 완료");
    } catch (e) {
      console.error("[Logout] ❌ React Query 캐시 정리 실패:", e);
    }
  }

  // 4. 초대 정보 정리 (preserveInviteInfo가 false인 경우만)
  if (!preserveInviteInfo) {
    try {
      // clearPendingInviteToken은 필요시 import하여 사용
      // 현재는 초대 정보가 localStorage에 저장되어 있으므로 유지
      console.log("[Logout] ℹ️ 초대 정보는 유지됨 (필요시 수동 정리)");
    } catch (e) {
      console.error("[Logout] ❌ 초대 정보 정리 실패:", e);
    }
  }

  // 5. 서버로 리다이렉트 (쿠키 삭제 처리)
  try {
    // localhost 환경에서는 현재 호스트를 사용, 그 외에는 getMainDomain() 사용
    // localhost에서 app-dev.talkgate.im으로 리다이렉트되는 것을 방지
    const currentHost = window.location.host;
    const isLocalhost = 
      currentHost.includes("localhost") || 
      currentHost.includes("127.0.0.1") ||
      /^\d+\.\d+\.\d+\.\d+/.test(currentHost.split(":")[0]);
    
    const mainDomain = isLocalhost ? currentHost : getMainDomain();
    const protocol = window.location.protocol;
    
    // 리다이렉트 URL 결정
    let finalRedirectUrl: string;
    if (redirectUrl) {
      // 절대 URL인 경우 그대로 사용, 상대 URL인 경우 절대 URL로 변환
      if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
        finalRedirectUrl = redirectUrl;
      } else if (redirectUrl.startsWith("/")) {
        finalRedirectUrl = `${protocol}//${mainDomain}${redirectUrl}`;
      } else {
        finalRedirectUrl = `${protocol}//${mainDomain}/${redirectUrl}`;
      }
    } else {
      // 기본값: 로그인 페이지로 이동
      finalRedirectUrl = `${protocol}//${mainDomain}/login?logout=success`;
    }

    const logoutUrl = `${protocol}//${mainDomain}/logout?redirect=${encodeURIComponent(finalRedirectUrl)}`;
    
    console.log("[Logout] 🔄 서버로 리다이렉트:", logoutUrl);
    
    // window.location.href를 사용하여 전체 페이지 리로드
    // 이렇게 하면 서버에서 쿠키 삭제가 확실히 처리됨
    window.location.href = logoutUrl;
  } catch (e) {
    console.error("[Logout] ❌ 리다이렉트 실패:", e);
    // 리다이렉트 실패 시 최소한 로그인 페이지로 이동 시도
    try {
      window.location.href = "/login";
    } catch (fallbackError) {
      console.error("[Logout] ❌ 폴백 리다이렉트도 실패:", fallbackError);
    }
  }
}

/**
 * 자동 로그아웃 (401 에러 등으로 인한 자동 로그아웃)
 * 
 * 공개 경로에서는 리다이렉트하지 않습니다 (리다이렉트 루프 방지).
 * 
 * @param currentPathname - 현재 경로 (공개 경로 체크용)
 */
export function performAutoLogout(currentPathname: string): void {
  if (typeof window === "undefined") return;

  // 공개 경로에서는 자동 로그아웃하지 않음 (리다이렉트 루프 방지)
  if (isPublicRoute(currentPathname)) {
    console.log("[Logout] ℹ️ 공개 경로에서는 자동 로그아웃하지 않음:", currentPathname);
    return;
  }

  console.log("[Logout] 🔄 자동 로그아웃 시작:", currentPathname);
  
  // WebSocket과 상태만 정리하고 리다이렉트는 performLogout에서 처리
  performLogout();
}

/**
 * 공개 경로인지 확인 (미들웨어 UNAUTHENTICATED_PATHS 및 인증 불필요 경로와 정렬)
 * - 이 경로에서는 401 시 자동 로그아웃(리다이렉트)을 하지 않음 (루프 방지)
 *
 * @param pathname - 확인할 경로
 * @returns 공개 경로 여부
 */
export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") || // /login/two-factor 등
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/invite") ||
    pathname === "/logout"
  );
}
