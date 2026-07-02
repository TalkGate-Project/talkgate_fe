"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearSelectedProjectId, clearUseAttendanceMenu, getSelectedProjectId } from "@/lib/project";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/hooks/useMe";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import NotificationBell from "./NotificationBell";
import { clearTokens } from "@/lib/token";
import UserMenuDropdown from "./UserMenuDropdown";
import { useChatContextSafe } from "@/providers/ChatProvider";
import { useTeamChatContextSafe } from "@/providers/TeamChatProvider";
import { useTeamChatWindow } from "@/providers/TeamChatWindowProvider";
import MobileDrawer from "./MobileDrawer";
import { requestNotificationPermission } from "@/utils/notification";

const BASE_NAV_ITEMS: { label: string; href: string }[] = [
  { label: "대시보드", href: "/dashboard" },
  { label: "상담", href: "/consult" },
  { label: "고객목록", href: "/customers" },
  { label: "통계", href: "/stats" },
];

const ATTENDANCE_ITEM = { label: "근태", href: "/attendance" };

const COMMON_NAV_ITEMS: { label: string; href: string }[] = [
  { label: "공지사항", href: "/notices" },
  { label: "설정", href: "/settings" },
];

const THEME_STORAGE_KEY = "talkgate-theme";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useMe();
  const [showAttendanceMenu, attendanceReady] = useAttendanceMenu();
  const chatContext = useChatContextSafe();
  const hasUnread = chatContext?.hasUnread ?? false;
  const teamChatContext = useTeamChatContextSafe();
  const teamChatHasUnread = teamChatContext?.hasUnread ?? false;
  const { toggle: toggleStaffChatModal } = useTeamChatWindow();

  // 근태 메뉴 포함 여부에 따라 네비게이션 아이템 구성
  // 프로젝트가 근태 메뉴를 사용하는 경우에만 헤더의 근태 메뉴 표시
  // 백엔드에서 권한 기반 필터링을 처리하므로 프론트엔드에서는 권한 체크 불필요
  // Hydration 에러 방지를 위해 attendanceReady를 체크
  const NAV_ITEMS = [
    ...BASE_NAV_ITEMS,
    ...(attendanceReady && showAttendanceMenu ? [ATTENDANCE_ITEM] : []),
    ...COMMON_NAV_ITEMS,
  ];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setMounted(true);
    setHasProject(Boolean(getSelectedProjectId()));
    const handleProjectChange = (e: CustomEvent<{ projectId: string | null }>) => {
      setHasProject(Boolean(e.detail.projectId));
    };
    window.addEventListener("tg:selected-project-change", handleProjectChange as EventListener);
    return () => {
      window.removeEventListener("tg:selected-project-change", handleProjectChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : prefersDark
        ? "dark"
        : "light";

    setIsDarkMode(initialTheme === "dark");
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    const theme = isDarkMode ? "dark" : "light";
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", isDarkMode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [mounted, isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };
  const isProjectsRoot = pathname === "/projects";
  const canShowStaffChatButton = Boolean(user) && hasProject && !isProjectsRoot;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 h-[54px] bg-[#252525] z-50"
        style={{ zoom: 1 }}
      >
        <div className="mx-auto w-full md:max-w-[1324px] h-full px-4 md:px-6 lg:px-0 flex items-center justify-between md:justify-start">
          {/* 모바일 햄버거 메뉴 (좌측) */}
          <div className="md:hidden flex items-center mr-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-white p-1"
              aria-label="메뉴 열기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* 브랜드 영역 (좌측) */}
          <div className="flex items-center h-full">
            <Link
              href="/dashboard"
              className="text-white text-[16px] font-semibold tracking-[-0.02em]"
            >
              <img src="/main_logo.webp" alt="Talkgate" className="w-[102px]" />
            </Link>
          </div>

          {/* 주요 메뉴 (데스크탑: 브랜드 오른쪽 정렬, 모바일: 숨김) */}
          <nav className="ml-8 hidden md:flex items-center gap-[26px] h-[17px]">
            {NAV_ITEMS.map(({ label, href }) => {
              const isActive = pathname === href;
              const isConsult = href === "/consult";
              const showRedDot = isConsult && hasUnread && mounted;

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  // 상담(채팅) 화면으로 이동하는 클릭은 실제 사용자 제스처이므로
                  // 여기서 알림 권한을 요청해야 Edge 등에서 조용히 무시되는 문제를 피할 수 있음
                  onClick={isConsult ? () => void requestNotificationPermission() : undefined}
                  className={`relative text-white text-[14px] leading-[17px] font-medium tracking-[-0.02em] ${
                    isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {label}
                  {/* 안 읽은 메시지가 있을 때 레드닷 표시 */}
                  {showRedDot && (
                    <span
                      className="absolute -top-1.5 -right-2 w-2 h-2 bg-[#D83232] rounded-full"
                      aria-label="안 읽은 메시지 있음"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 우측 액션 영역 */}
          <div className="ml-auto flex items-center gap-4">
            {/* 직원채팅: 모달로 연다 (모달 UI는 별도 작업에서 구현) */}
            {canShowStaffChatButton && (
              <button
                className="cursor-pointer relative w-6 h-6 text-white hover:opacity-80 transition-opacity flex items-center justify-center"
                onClick={() => {
                  void requestNotificationPermission();
                  toggleStaffChatModal();
                }}
                aria-label="직원채팅"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {mounted && teamChatHasUnread && (
                  <span
                    className="absolute top-[1px] right-[1px] block w-[6px] h-[6px] rounded-full bg-[#51F8A5]"
                    aria-label="읽지 않은 메시지 있음"
                  />
                )}
              </button>
            )}

            {/* 알림 아이콘 + 플로팅 */}
            <NotificationBell />

            {/* 아바타 및 드롭다운 */}
            <div className="relative" ref={menuRef}>
              <button
                className="cursor-pointer w-8 h-8 rounded-full overflow-hidden grid place-items-center"
                onClick={() => setOpen((v) => !v)}
              >
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name || "프로필"}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#808080] grid place-items-center">
                    <span className="text-white text-[14px] font-semibold tracking-[-0.02em]">
                      {user?.name ? user.name.charAt(0) : "김"}
                    </span>
                  </div>
                )}
              </button>
              {open && (
                <UserMenuDropdown
                  user={user}
                  variant="full"
                  onClose={() => setOpen(false)}
                  isDarkMode={isDarkMode}
                  onToggleTheme={handleToggleTheme}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 드로워 */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
    </>
  );
}
