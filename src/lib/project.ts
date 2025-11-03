"use client";

const COOKIE_KEY = "tg_selected_project_id";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function cookieAttrs(): string {
  if (process.env.NODE_ENV === "production") {
    return ["Path=/", "SameSite=None", "Secure"].join("; ");
  }
  return ["Path=/", "SameSite=Lax"].join("; ");
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
  } catch {}
}

export function getSelectedProjectId(): string | null {
  if (!isBrowser()) return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function clearSelectedProjectId() {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE_KEY}=; Max-Age=0; ${cookieAttrs()}`;
  try {
    window.dispatchEvent(
      new CustomEvent("tg:selected-project-change", {
        detail: { projectId: null },
      })
    );
  } catch {}
}


