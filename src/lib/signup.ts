// 회원가입 진행 중 상태 저장/복구 유틸리티

export type PendingSignupState = {
  email: string;
  step: "verify" | "profile";
  timestamp: number; // 저장 시점 (만료 체크용)
};

const STORAGE_KEY = "tg_pending_signup";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * 회원가입 진행 중 상태를 localStorage에 저장
 */
export function savePendingSignupState(state: PendingSignupState): void {
  if (!isBrowser()) return;
  
  try {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    console.log("[signup] 💾 회원가입 상태 저장:", { email: state.email, step: state.step });
  } catch (error) {
    console.error("[signup] ❌ 회원가입 상태 저장 실패:", error);
  }
}

/**
 * 저장된 회원가입 상태를 가져옴 (만료된 경우 null 반환)
 */
export function getPendingSignupState(): PendingSignupState | null {
  if (!isBrowser()) return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored) as PendingSignupState & { timestamp: number };
    
    // 만료 체크 (24시간 경과 시 삭제)
    if (Date.now() - state.timestamp > EXPIRY_MS) {
      console.log("[signup] ⏰ 저장된 회원가입 상태 만료 - 삭제");
      clearPendingSignupState();
      return null;
    }
    
    console.log("[signup] 📥 저장된 회원가입 상태 복구:", { email: state.email, step: state.step });
    return state;
  } catch (error) {
    console.error("[signup] ❌ 회원가입 상태 복구 실패:", error);
    clearPendingSignupState();
    return null;
  }
}

/**
 * 저장된 회원가입 상태 삭제
 */
export function clearPendingSignupState(): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[signup] 🗑️ 회원가입 상태 삭제");
  } catch (error) {
    console.error("[signup] ❌ 회원가입 상태 삭제 실패:", error);
  }
}
