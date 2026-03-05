import { useEffect, useState } from "react";

const TABLET_BREAKPOINT = 780;
const DESKTOP_BREAKPOINT = 1280;

/**
 * 채팅 레이아웃 관련 로직을 관리하는 훅
 * 모바일/태블릿/데스크톱 레이아웃 상태를 관리합니다.
 */
export function useChatLayout() {
  // 780px 이상이면 리스트/메인 2컬럼(모바일 오버레이 해제)
  const [isWideLayout, setIsWideLayout] = useState(true);
  // 1280px 이상이면 데스크톱 3컬럼(우측 AI 고정)
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  // breakpoints: mobile(<780), tablet(780-1079), desktop(>=1080)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const width = window.innerWidth;
      setIsWideLayout(width >= TABLET_BREAKPOINT);
      setIsDesktopLayout(width >= DESKTOP_BREAKPOINT);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 데스크톱으로 전환되면 플로팅 패널은 자동으로 닫기
  useEffect(() => {
    if (isDesktopLayout && isAiSidebarOpen) {
      setIsAiSidebarOpen(false);
    }
  }, [isDesktopLayout, isAiSidebarOpen]);

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
    isMobileLayout: !isWideLayout,
    isWideLayout,
    isDesktopLayout,
    isAiSidebarOpen,
    setIsAiSidebarOpen,
  };
}
