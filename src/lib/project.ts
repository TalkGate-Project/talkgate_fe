"use client";

const COOKIE_KEY = "tg_selected_project_id";
const ATTENDANCE_STORAGE_KEY = "tg_use_attendance_menu";
const ATTENDANCE_COOKIE_KEY = "tg_use_attendance_menu";

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
    const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";

    // localStorage에 값이 없으면(다른 origin 최초 진입 등) 쿠키 값을 사용
    const cookieValue = getCookieValue(ATTENDANCE_COOKIE_KEY);
    const fromCookie = cookieValue === "true";

    // 다음 호출부터는 localStorage에서도 바로 읽을 수 있게 동기화
    if (cookieValue === "true" || cookieValue === "false") {
      try {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, cookieValue);
      } catch {
        // localStorage 접근 불가 환경(Private Browsing 등)에서는 무시
      }
    }

    return fromCookie;
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


