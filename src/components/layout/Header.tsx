"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearSelectedProjectId, clearUseAttendanceMenu } from "@/lib/project";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/hooks/useMe";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import NotificationBell from "./NotificationBell";
import { clearTokens } from "@/lib/token";
import UserMenuDropdown from "./UserMenuDropdown";
import { useChatContextSafe } from "@/providers/ChatProvider";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useMe();
  const [showAttendanceMenu, attendanceReady] = useAttendanceMenu();
  const chatContext = useChatContextSafe();
  const hasUnread = chatContext?.hasUnread ?? false;

  // 근태 메뉴 포함 여부에 따라 네비게이션 아이템 구성
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
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme = storedTheme === "dark" || storedTheme === "light"
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

  return (
    <header className="fixed top-0 left-0 right-0 h-[54px] bg-[#252525] z-50">
      <div className="mx-auto max-w-[1324px] w-full h-full px-0 flex items-center">
        {/* 브랜드 영역 (좌측) */}
        <div className="flex items-center h-full">
          <Link href="/dashboard" className="text-white text-[16px] font-semibold tracking-[-0.02em]">
            <img src="/main_logo.png" alt="Talkgate" className="w-[102px]" />
          </Link>
        </div>

        {/* 주요 메뉴 (브랜드 오른쪽 정렬) */}
        <nav className="ml-8 flex items-center gap-[26px] h-[17px]">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href;
            const isConsult = href === "/consult";
            const showRedDot = isConsult && hasUnread && mounted;
            
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={`relative text-white text-[14px] leading-[17px] font-medium tracking-[-0.02em] ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
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
          {/* 다크 모드 토글 버튼 */}
          {mounted ? (
            <button
              onClick={handleToggleTheme}
              className="cursor-pointer relative w-6 h-6 text-white hover:opacity-80 transition-opacity"
              aria-label="다크 모드 전환"
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 18a6 6 0 100-12 6 6 0 000 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 21v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.36 18.36l1.42 1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20.3542 15.3542C19.3176 15.7708 18.1856 16.0001 17 16.0001C12.0294 16.0001 8 11.9706 8 7.00006C8 5.81449 8.22924 4.68246 8.64581 3.64587C5.33648 4.9758 3 8.21507 3 12.0001C3 16.9706 7.02944 21.0001 12 21.0001C15.785 21.0001 19.0243 18.6636 20.3542 15.3542Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ) : (
            <span className="relative block w-6 h-6" aria-hidden />
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
                />
              ) : (
                <div className="w-full h-full bg-[#808080] grid place-items-center">
                  <span className="text-white text-[14px] font-semibold tracking-[-0.02em]">
                    {user?.name ? user.name.charAt(0) : "김"}
                  </span>
                </div>
              )}
            </button>
            {open && <UserMenuDropdown user={user} variant="full" onClose={() => setOpen(false)} />}
          </div>
        </div>
      </div>
    </header>
  );
}



