"use client";

const COOKIE_KEY = "tg_selected_project_id";
const ATTENDANCE_STORAGE_KEY = "tg_use_attendance_menu";
const MAIN_DOMAIN = "talkgate.im";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * 쿠키 도메인을 반환합니다.
 * 모든 서브도메인에서 쿠키를 공유하기 위해 루트 도메인을 반환합니다.
 */
function getCookieDomain(): string | undefined {
  if (!isBrowser()) return undefined;
  
  const host = window.location.hostname;
  
  // localhost의 경우 domain 설정하지 않음
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return undefined;
  }
  
  // 프로덕션: .talkgate.im으로 설정 (앞에 점을 붙여서 모든 서브도메인 포함)
  return `.${MAIN_DOMAIN}`;
}

function cookieAttrs(): string {
  const maxAge = 60 * 60 * 24 * 30; // 30일
  const domain = getCookieDomain();
  const domainAttr = domain ? `Domain=${domain}` : "";
  
  if (process.env.NODE_ENV === "production") {
    const attrs = ["Path=/", "SameSite=None", "Secure", `Max-Age=${maxAge}`];
    if (domainAttr) attrs.push(domainAttr);
    const result = attrs.join("; ");
    console.log("[Project] 🔐 Production 프로젝트 쿠키 속성:", result);
    return result;
  }
  const attrs = ["Path=/", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (domainAttr) attrs.push(domainAttr);
  const result = attrs.join("; ");
  console.log("[Project] 🔧 Development 프로젝트 쿠키 속성:", result);
  return result;
}

export function setSelectedProjectId(projectId: string | number) {
  if (!isBrowser()) return;
  console.log("[Project] 📁 setSelectedProjectId 호출:", projectId);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(String(projectId))}; ${cookieAttrs()}`;
  console.log("[Project] ✅ 프로젝트 ID 쿠키 저장 완료");
  try {
    (window as any).tgSelectedProjectId = String(projectId);
    window.dispatchEvent(
      new CustomEvent("tg:selected-project-change", {
        detail: { projectId: String(projectId) },
      })
    );
  } catch {}
}

export function getSelectedProjectId(): string | null {
  if (!isBrowser()) return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * 모든 가능한 도메인 패턴에서 프로젝트 ID 쿠키를 삭제합니다.
 */
export function clearSelectedProjectId() {
  if (!isBrowser()) return;
  
  console.log("[Project] 🗑️ clearSelectedProjectId 호출 - 모든 도메인 패턴에서 쿠키 삭제 시도");
  
  const host = window.location.hostname;
  
  // 삭제할 도메인 패턴들
  const domainsToTry: (string | undefined)[] = [
    undefined,                    // 현재 호스트 (도메인 속성 없음)
    `.${MAIN_DOMAIN}`,           // .talkgate.im (루트 도메인)
    MAIN_DOMAIN,                 // talkgate.im
  ];
  
  // 현재 호스트가 서브도메인인 경우 해당 도메인도 추가
  if (host !== "localhost" && host !== "127.0.0.1" && host.endsWith(`.${MAIN_DOMAIN}`)) {
    domainsToTry.push(host);
    domainsToTry.push(`.${host}`);
  }
  
  // 모든 도메인 패턴으로 삭제 시도
  domainsToTry.forEach((domain) => {
    const domainAttr = domain ? `Domain=${domain};` : "";
    document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; ${domainAttr}`;
    document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; ${domainAttr} Secure;`;
    document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; ${domainAttr} SameSite=None; Secure;`;
    document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; ${domainAttr} SameSite=Lax;`;
  });
  
  console.log("[Project] ✅ 프로젝트 ID 쿠키 삭제 시도 완료");
  
  try {
    window.dispatchEvent(
      new CustomEvent("tg:selected-project-change", {
        detail: { projectId: null },
      })
    );
  } catch {}
}

// 근태 메뉴 사용 여부 관리
export function setUseAttendanceMenu(useAttendance: boolean) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, String(useAttendance));
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
    return stored === "true";
  } catch (e) {
    console.error("Failed to get attendance menu state:", e);
    return false;
  }
}

export function clearUseAttendanceMenu() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear attendance menu state:", e);
  }
}


