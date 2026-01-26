import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "chat_width_mode";
const MAIN_WIDTH_NORMAL = 688; // 기본 모드: 메인 뷰 너비 (px)
const SIDEBAR_WIDTH_NORMAL = 286; // 기본 모드: 사이드바 너비 (px)

type WidthMode = "normal" | "swapped";

/**
 * 채팅 뷰 너비 치환 관련 로직을 관리하는 훅
 * 웹에서만 동작하며, 모바일에는 영향 없음
 * 두 가지 모드: normal (688px/286px) ↔ swapped (286px/688px)
 */
export function useChatResizer() {
  const [widthMode, setWidthMode] = useState<WidthMode>("normal");

  // localStorage에서 저장된 모드 복원
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "normal" || stored === "swapped") {
        setWidthMode(stored);
      }
    } catch (error) {
      console.error("Failed to load chat width mode:", error);
    }
  }, []);

  // 너비 치환 (메인과 사이드바 교환)
  const swapWidths = useCallback(() => {
    setWidthMode((prev) => {
      const newMode = prev === "normal" ? "swapped" : "normal";
      
      // localStorage에 저장
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, newMode);
        } catch (error) {
          console.error("Failed to save chat width mode:", error);
        }
      }
      
      return newMode;
    });
  }, []);

  // 현재 모드에 따른 너비 계산
  const mainWidth = widthMode === "normal" ? MAIN_WIDTH_NORMAL : SIDEBAR_WIDTH_NORMAL;
  const sidebarWidth = widthMode === "normal" ? SIDEBAR_WIDTH_NORMAL : MAIN_WIDTH_NORMAL;

  return {
    mainWidth,
    sidebarWidth,
    swapWidths,
    widthMode,
  };
}
