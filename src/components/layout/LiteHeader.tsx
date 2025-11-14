"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearTokens } from "@/lib/token";
import { clearSelectedProjectId } from "@/lib/project";
import { useMe } from "@/hooks/useMe";

const THEME_STORAGE_KEY = "talkgate-theme";

export default function LiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isProjectSelectHovered, setIsProjectSelectHovered] = useState(false);
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
        {/* 좌측: 로그인으로 이동하는 브랜드 로고 */}
        <div className="flex items-center h-full">
          <Link href="/login" className="text-white text-[16px] font-semibold tracking-[-0.02em]">
            <img src="/main_logo.png" alt="Talkgate" className="w-[102px]" />
          </Link>
        </div>

        {/* 우측 액션: 다크모드 + 개인화 드롭다운만 */}
        <div className="ml-auto flex items-center gap-4">
          {mounted ? (
            <button
              onClick={handleToggleTheme}
              className="cursor-pointer relative w-6 h-6 text-white hover:opacity-80 transition-opacity"
              aria-label="다크 모드 전환"
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  <path d="M20.3542 15.3542C19.3176 15.7708 18.1856 16.0001 17 16.0001C12.0294 16.0001 8 11.9706 8 7.00006C8 5.81449 8.22924 4.68246 8.64581 3.64587C5.33648 4.9758 3 8.21507 3 12.0001C3 16.9706 7.02944 21.0001 12 21.0001C15.785 21.0001 19.0243 18.6636 20.3542 15.3542Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ) : (
            <span className="relative block w-6 h-6" aria-hidden />
          )}

          {/* 아바타 + 드롭다운 (개인설정/프로젝트 선택/로그아웃) */}
          <div className="relative" ref={menuRef}>
            <button
              className="cursor-pointer w-8 h-8 rounded-full bg-[#808080] grid place-items-center"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="text-white text-[14px] font-semibold leading-[17px] tracking-[-0.02em]">
                {user?.name ? user.name.charAt(0) : "김"}
              </span>
            </button>
            {open && (
              <div className="absolute right-0 top-[65px] w-[360px] bg-white rounded-[10px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] py-5 z-50">
                <div className="flex flex-col gap-3 px-6 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#808080] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[18px] font-semibold leading-5 text-center tracking-[-0.02em]">
                        {user?.name ? user.name.charAt(0) : "김"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-[16px] font-semibold leading-5 text-[#000000] tracking-[0.2px]">
                          {user?.email || "user@kakao.com"}
                        </div>
                        <div className="w-px h-4 bg-[#808080]"></div>
                        <div className="text-[14px] font-medium leading-5 text-[#808080]">A팀</div>
                      </div>
                      <div className="text-[14px] font-medium leading-5 text-[#808080]">
                        UID : {user?.id || "12345"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-[#E2E2E266] mb-2.5"></div>

                <div className="flex flex-col gap-1">
                  <button
                    className={`cursor-pointer flex items-center gap-4 px-7 py-5 transition-colors ${isProfileHovered ? "bg-[rgba(214,250,232,0.3)]" : ""}`}
                    onMouseEnter={() => setIsProfileHovered(true)}
                    onMouseLeave={() => setIsProfileHovered(false)}
                    onClick={() => {
                      setOpen(false);
                      router.push("/my-settings");
                    }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke={isProfileHovered ? "#00E272" : "#808080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke={isProfileHovered ? "#00E272" : "#808080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={`text-[16px] tracking-[-0.02em] ${isProfileHovered ? "font-bold text-[#00E272]" : "font-medium text-[#808080]"}`}>
                      개인설정
                    </span>
                  </button>

                  <button
                    className={`cursor-pointer flex items-center gap-4 px-7 py-5 transition-colors ${isProjectSelectHovered ? "bg-[rgba(214,250,232,0.3)]" : ""}`}
                    onMouseEnter={() => setIsProjectSelectHovered(true)}
                    onMouseLeave={() => setIsProjectSelectHovered(false)}
                    onClick={() => {
                      setOpen(false);
                      router.push("/projects");
                    }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={isProjectSelectHovered ? "#00E272" : "#808080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={isProjectSelectHovered ? "#00E272" : "#808080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={`text-[16px] tracking-[-0.02em] ${isProjectSelectHovered ? "font-bold text-[#00E272]" : "font-medium text-[#808080]"}`}>
                      프로젝트 선택
                    </span>
                  </button>

                  <button
                    className="flex items-center gap-4 px-7 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      clearTokens();
                      clearSelectedProjectId();
                      setOpen(false);
                      router.replace("/login");
                    }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[16px] font-medium text-[#808080] tracking-[-0.02em]">로그아웃</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


