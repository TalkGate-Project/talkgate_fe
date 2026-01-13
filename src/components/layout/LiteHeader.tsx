"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { clearTokens } from "@/lib/token";
import { clearSelectedProjectId } from "@/lib/project";
import { useMe } from "@/hooks/useMe";
import UserMenuDropdown from "./UserMenuDropdown";

const THEME_STORAGE_KEY = "talkgate-theme";

export default function LiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useMe();

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

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[54px] bg-[#252525] z-50"
      style={{ zoom: 1 }}
    >
      <div className="mx-auto w-full lg:max-w-[1410px] h-full px-4 lg:px-0 flex items-center justify-between lg:justify-start">
        {/* 좌측: 로그인으로 이동하는 브랜드 로고 */}
        <div className="flex items-center h-full">
          <Image src="/main_logo.png" alt="Talkgate" width={102} height={24} />
        </div>

        {/* 우측 액션: 다크모드 + 개인화 드롭다운만 */}
        <div className="ml-auto flex items-center gap-4">
          <button
            className="cursor-pointer relative w-7 h-7 text-white hover:opacity-80 transition-opacity flex items-center justify-center"
            onClick={() =>
              window.open("https://talkgate.gitbook.io/talkgate", "_blank")
            }
          >
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 9C9.54912 7.83481 10.2584 7 12.0001 7C14.2092 7 15.5 8.34315 15.5 10C15.5 11.3994 14.7224 12.5751 12.9943 12.9066C12.4519 13.0106 12.0001 13.4477 12.0001 14M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {mounted ? (
            <button
              onClick={handleToggleTheme}
              className="cursor-pointer relative w-6 h-6 text-white hover:opacity-80 transition-opacity"
              aria-label="다크 모드 전환"
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 18a6 6 0 100-12 6 6 0 000 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 1v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 21v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.22 4.22L5.64 5.64"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.36 18.36l1.42 1.42"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 12h2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12h2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.22 19.78L5.64 18.36"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.36 5.64l1.42-1.42"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
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
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
