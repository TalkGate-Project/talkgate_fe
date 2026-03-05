"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/hooks/useMe";
import { getSelectedProjectId } from "@/lib/project";
import UserMenuDropdown from "./UserMenuDropdown";
import NotificationBell from "./NotificationBell";
import { useTeamChatContextSafe } from "@/providers/TeamChatProvider";
import { useTeamChatWindow } from "@/providers/TeamChatWindowProvider";

const THEME_STORAGE_KEY = "talkgate-theme";
const LITE_NAV_ITEMS: { label: string; href: string }[] = [
  { label: "대시보드", href: "/dashboard" },
  { label: "상담", href: "/consult" },
  { label: "고객목록", href: "/customers" },
  { label: "통계", href: "/stats" },
  { label: "공지사항", href: "/notices" },
  { label: "설정", href: "/settings" },
];

export default function LiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useMe();
  const teamChatContext = useTeamChatContextSafe();
  const teamChatHasUnread = teamChatContext?.hasUnread ?? false;
  const { toggle: toggleStaffChatModal } = useTeamChatWindow();

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
    <header
      className="fixed top-0 left-0 right-0 h-[54px] bg-[#252525] z-50"
      style={{ zoom: 1 }}
    >
      <div className="mx-auto w-full md:max-w-[1410px] h-full px-4 md:px-0 flex items-center justify-between md:justify-start">
        {/* 좌측: 로그인으로 이동하는 브랜드 로고 */}
        <div className="flex items-center h-full">
          <Image src="/main_logo.png" alt="Talkgate" width={102} height={24} />
        </div>

        {/* 태블릿 구간(780~1079) 메뉴 노출 */}
        <nav className="ml-8 hidden md:flex lg:hidden items-center gap-[26px] h-[17px]">
          {LITE_NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={`relative text-white text-[14px] leading-[17px] font-medium tracking-[-0.02em] ${
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 액션: 직원채팅 + 알림 + 개인화 드롭다운 */}
        <div className="ml-auto flex items-center gap-4">
          {/* 직원채팅: 모달로 연다 */}
          {canShowStaffChatButton && (
            <button
              className="cursor-pointer relative w-6 h-6 text-white hover:opacity-80 transition-opacity flex items-center justify-center"
              onClick={toggleStaffChatModal}
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
                  className="absolute top-1 right-1 block w-[6px] h-[6px] rounded-full bg-[#51F8A5]"
                  aria-label="읽지 않은 메시지 있음"
                />
              )}
            </button>
          )}

          <NotificationBell />

          {/* 아바타 + 드롭다운 (개인설정/프로젝트 선택/로그아웃) */}
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
                variant="lite"
                onClose={() => setOpen(false)}
                isDarkMode={isDarkMode}
                onToggleTheme={handleToggleTheme}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
