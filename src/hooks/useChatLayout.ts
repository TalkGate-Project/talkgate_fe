import { useEffect, useState } from "react";

/**
 * 채팅 레이아웃 관련 로직을 관리하는 훅
 * 1280px 기준으로 레이아웃 전환 및 AI 사이드바 상태 관리
 */
export function useChatLayout() {
  // 화면 폭에 따른 레이아웃 제어 (1280px 이상: 기존 3컬럼, 미만: AI 도우미 플로팅)
  const [isWideLayout, setIsWideLayout] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  // 1280px 기준으로 레이아웃 전환
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsWideLayout(window.innerWidth >= 1279);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 넓은 레이아웃으로 전환되면 플로팅 패널은 자동으로 닫기
  useEffect(() => {
    if (isWideLayout && isAiSidebarOpen) {
      setIsAiSidebarOpen(false);
    }
  }, [isWideLayout, isAiSidebarOpen]);

  // AI 사이드바 닫기 이벤트 리스너
  useEffect(() => {
    const handleCloseAiSidebar = () => {
      setIsAiSidebarOpen(false);
    };
    window.addEventListener("close-ai-sidebar", handleCloseAiSidebar);
    return () => {
      window.removeEventListener("close-ai-sidebar", handleCloseAiSidebar);
    };
  }, []);

  return {
    isWideLayout,
    isAiSidebarOpen,
    setIsAiSidebarOpen,
  };
}
