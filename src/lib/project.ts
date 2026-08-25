"use client";

import type { ProjectType } from "@/types/projects";

const COOKIE_KEY = "tg_selected_project_id";
const ATTENDANCE_STORAGE_KEY = "tg_use_attendance_menu";
const ATTENDANCE_COOKIE_KEY = "tg_use_attendance_menu";
const PROJECT_TYPE_STORAGE_KEY = "tg_project_type";
const PROJECT_TYPE_COOKIE_KEY = "tg_project_type";

const PROJECT_TYPES: readonly ProjectType[] = ["general", "analysis", "lawyer"];

function isProjectType(value: string | null | undefined): value is ProjectType {
  return value === "general" || value === "analysis" || value === "lawyer";
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getCookieValue(name: string): string | null {
  if (!isBrowser()) return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * 현재 호스트가 프로덕션 도메인인지 확인합니다.
 */
function isProductionDomain(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".talkgate.im") || host === "talkgate.im";
}

/**
 * 쿠키 속성을 생성합니다.
 * 프로덕션 환경(.talkgate.im)에서는 Domain 속성을 명시하여 서브도메인 간 쿠키 공유를 지원합니다.
 */
function cookieAttrs(): string {
  const maxAge = 60 * 60 * 24 * 30; // 30일
  const attrs: string[] = ["Path=/", `Max-Age=${maxAge}`];
  
  // HTTPS 환경에서는 SameSite=None; Secure 사용
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attrs.push("SameSite=None");
    attrs.push("Secure");
    
    // 프로덕션 도메인에서는 Domain 속성을 명시하여 서브도메인 간 쿠키 공유
    if (isProductionDomain()) {
      attrs.push("Domain=.talkgate.im");
    }
  } else {
    attrs.push("SameSite=Lax");
  }
  
  return attrs.join("; ");
}

export function setSelectedProjectId(projectId: string | number) {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(String(projectId))}; ${cookieAttrs()}`;
  try {
    (window as any).tgSelectedProjectId = String(projectId);
    window.dispatchEvent(
      new CustomEvent("tg:selected-project-change", {
        detail: { projectId: String(projectId) },
      })
    );
  } catch {
    // 이벤트 디스패치 실패는 무시 (UI 업데이트에만 영향)
  }
}

export function getSelectedProjectId(): string | null {
  if (!isBrowser()) return null;
  return getCookieValue(COOKIE_KEY);
}

/**
 * 프로젝트 ID 쿠키를 삭제합니다.
 * 프로덕션 환경에서는 Domain 속성도 명시하여 서브도메인 간 쿠키를 완전히 삭제합니다.
 */
export function clearSelectedProjectId() {
  if (!isBrowser()) return;
  
  const attrs: string[] = ["Max-Age=0", "Path=/"];
  
  // HTTPS 환경에서는 Secure 속성 추가
  if (window.location.protocol === "https:") {
    attrs.push("Secure");
    
    // 프로덕션 도메인에서는 Domain 속성도 명시
    if (isProductionDomain()) {
      attrs.push("Domain=.talkgate.im");
    }
  }
  
  const attrString = attrs.join("; ");
  document.cookie = `${COOKIE_KEY}=; ${attrString}`;
  
  try {
    window.dispatchEvent(
      new CustomEvent("tg:selected-project-change", {
        detail: { projectId: null },
      })
    );
  } catch {
    // 이벤트 디스패치 실패는 무시 (UI 업데이트에만 영향)
  }
}

// 근태 메뉴 사용 여부 관리
export function setUseAttendanceMenu(useAttendance: boolean) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, String(useAttendance));
    // 서브도메인 이동 시에도 동일한 값을 사용할 수 있도록 쿠키에도 저장
    document.cookie = `${ATTENDANCE_COOKIE_KEY}=${encodeURIComponent(String(useAttendance))}; ${cookieAttrs()}`;
    window.dispatchEvent(
      new CustomEvent("tg:attendance-menu-change", {
        detail: { useAttendanceMenu: useAttendance },
      })
    );
  } catch (e) {
    console.error("Failed to set attendance menu state:", e);
  }
}

export function getUseAttendanceMenu(): boolean {
  if (!isBrowser()) return false;
  try {
    // 쿠키가 원본 — 미들웨어가 매 요청마다 서버 값으로 갱신하므로 localStorage보다 우선한다.
    // (localStorage를 우선하면 다른 기기에서 바꾼 설정이 영원히 반영되지 않음)
    const cookieValue = getCookieValue(ATTENDANCE_COOKIE_KEY);
    if (cookieValue === "true" || cookieValue === "false") {
      try {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, cookieValue);
      } catch {
        // localStorage 접근 불가 환경(Private Browsing 등)에서는 무시
      }
      return cookieValue === "true";
    }

    // 쿠키가 없는 경우(미들웨어 미적용 경로 등)에만 로컬 캐시로 폴백
    const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";

    return false;
  } catch (e) {
    console.error("Failed to get attendance menu state:", e);
    return false;
  }
}

export function clearUseAttendanceMenu() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);

    const attrs: string[] = ["Max-Age=0", "Path=/"];
    if (window.location.protocol === "https:") {
      attrs.push("Secure");
      if (isProductionDomain()) {
        attrs.push("Domain=.talkgate.im");
      }
    }
    document.cookie = `${ATTENDANCE_COOKIE_KEY}=; ${attrs.join("; ")}`;
  } catch (e) {
    console.error("Failed to clear attendance menu state:", e);
  }
}

/** 회생·파산 메뉴 대상 프로젝트 타입 (영업 analysis / 변호사 lawyer) */
export function isDebtReliefProjectType(type: ProjectType | null | undefined): boolean {
  return type === "analysis" || type === "lawyer";
}

export function setProjectType(projectType: ProjectType) {
  if (!isBrowser()) return;
  if (!PROJECT_TYPES.includes(projectType)) return;
  try {
    localStorage.setItem(PROJECT_TYPE_STORAGE_KEY, projectType);
    document.cookie = `${PROJECT_TYPE_COOKIE_KEY}=${encodeURIComponent(projectType)}; ${cookieAttrs()}`;
    window.dispatchEvent(
      new CustomEvent("tg:project-type-change", {
        detail: { projectType },
      })
    );
  } catch (e) {
    console.error("Failed to set project type:", e);
  }
}

export function getProjectType(): ProjectType | null {
  if (!isBrowser()) return null;
  try {
    // 쿠키 우선 — 근거는 getUseAttendanceMenu 주석 참고
    const cookieValue = getCookieValue(PROJECT_TYPE_COOKIE_KEY);
    if (isProjectType(cookieValue)) {
      try {
        localStorage.setItem(PROJECT_TYPE_STORAGE_KEY, cookieValue);
      } catch {
        // localStorage 접근 불가 환경에서는 무시
      }
      return cookieValue;
    }

    const stored = localStorage.getItem(PROJECT_TYPE_STORAGE_KEY);
    if (isProjectType(stored)) return stored;

    return null;
  } catch (e) {
    console.error("Failed to get project type:", e);
    return null;
  }
}

export function clearProjectType() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(PROJECT_TYPE_STORAGE_KEY);

    const attrs: string[] = ["Max-Age=0", "Path=/"];
    if (window.location.protocol === "https:") {
      attrs.push("Secure");
      if (isProductionDomain()) {
        attrs.push("Domain=.talkgate.im");
      }
    }
    document.cookie = `${PROJECT_TYPE_COOKIE_KEY}=; ${attrs.join("; ")}`;
  } catch (e) {
    console.error("Failed to clear project type:", e);
  }
}


