"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens } from "@/lib/token";
import { clearSelectedProjectId, clearUseAttendanceMenu } from "@/lib/project";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/hooks/useMe";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import NotificationBell from "./NotificationBell";

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
  const [open, setOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isProjectSelectHovered, setIsProjectSelectHovered] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useMe();
  const [showAttendanceMenu, attendanceReady] = useAttendanceMenu();

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
            return (
              <Link
                key={href}
                href={href}
                className={`text-white text-[14px] leading-[17px] font-medium tracking-[-0.02em] ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                  }`}
              >
                {label}
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
                <Image
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
              <div className="absolute right-0 top-[65px] w-[360px] bg-white rounded-[10px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] py-5 z-50">
                {/* 사용자 정보 영역 (프로젝트 선택됨 - 3줄) */}
                <div className="flex flex-col gap-3 px-6 mb-3">
                  <div className="flex items-center gap-3">
                    {/* 아바타 */}
                    {user?.profileImageUrl ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={user.profileImageUrl}
                          alt={user.name || "프로필"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-60 flex-shrink-0 flex items-center justify-center">
                        <span className="text-white text-[18px] font-semibold tracking-[-0.02em]">
                          {user?.name ? user.name.charAt(0) : "김"}
                        </span>
                      </div>
                    )}

                    {/* 사용자 상세 정보 */}
                    <div className="flex-1 min-w-0 flex flex-col gap-[8px]">
                      {/* 첫째 줄: 멤버이름 | 팀명 */}
                      <div className="flex items-center gap-2">
                        <div className="text-[16px] font-semibold leading-[20px] text-[#000000] tracking-[0.2px]">
                          {user?.name || "김직원"}
                        </div>
                        <div className="w-px h-4 bg-[#808080]"></div>
                        <div className="text-[14px] font-medium leading-[20px] text-[#808080]">
                          {user?.teamName || "-"}
                        </div>
                      </div>
                      {/* 둘째 줄: 이메일 */}
                      <div className="text-[14px] font-medium leading-[20px] text-[#000000]">
                        {user?.email || "user@kakao.com"}
                      </div>
                      {/* 셋째 줄: UID */}
                      <div className="text-[14px] font-medium leading-[20px] text-[#808080]">
                        UID : {user?.id || "12345"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="w-full h-[1px] bg-[#E2E2E266] mb-2.5"></div>

                {/* 메뉴 목록 */}
                <div className="flex flex-col gap-1">
                  {/* 개인 설정 */}
                  <button
                    className={`cursor-pointer flex items-center h-[52px] gap-4 px-7 transition-colors ${isProfileHovered ? "bg-[rgba(214,250,232,0.3)]" : ""
                      }`}
                    onMouseEnter={() => setIsProfileHovered(true)}
                    onMouseLeave={() => setIsProfileHovered(false)}
                    onClick={() => {
                      setOpen(false);
                      router.push("/my-settings");
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.3246 4.31731C10.751 2.5609 13.249 2.5609 13.6754 4.31731C13.9508 5.45193 15.2507 5.99038 16.2478 5.38285C17.7913 4.44239 19.5576 6.2087 18.6172 7.75218C18.0096 8.74925 18.5481 10.0492 19.6827 10.3246C21.4391 10.751 21.4391 13.249 19.6827 13.6754C18.5481 13.9508 18.0096 15.2507 18.6172 16.2478C19.5576 17.7913 17.7913 19.5576 16.2478 18.6172C15.2507 18.0096 13.9508 18.5481 13.6754 19.6827C13.249 21.4391 10.751 21.4391 10.3246 19.6827C10.0492 18.5481 8.74926 18.0096 7.75219 18.6172C6.2087 19.5576 4.44239 17.7913 5.38285 16.2478C5.99038 15.2507 5.45193 13.9508 4.31731 13.6754C2.5609 13.249 2.5609 10.751 4.31731 10.3246C5.45193 10.0492 5.99037 8.74926 5.38285 7.75218C4.44239 6.2087 6.2087 4.44239 7.75219 5.38285C8.74926 5.99037 10.0492 5.45193 10.3246 4.31731Z" stroke={isProfileHovered ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke={isProfileHovered ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <span className={`text-[16px] tracking-[-0.02em] ${isProfileHovered ? "font-bold text-[#00E272]" : "font-medium text-[#808080]"
                      }`}>
                      개인설정
                    </span>
                  </button>

                  {/* 프로젝트 선택 */}
                  <button
                    className={`cursor-pointer flex items-center h-[52px] gap-4 px-7 transition-colors ${isProjectSelectHovered ? "bg-[rgba(214,250,232,0.3)]" : ""
                      }`}
                    onMouseEnter={() => setIsProjectSelectHovered(true)}
                    onMouseLeave={() => setIsProjectSelectHovered(false)}
                    onClick={() => {
                      setOpen(false);
                      router.push("/projects");
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" stroke={isProjectSelectHovered ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 13C4 12.4477 4.44772 12 5 12H11C11.5523 12 12 12.4477 12 13V19C12 19.5523 11.5523 20 11 20H5C4.44772 20 4 19.5523 4 19V13Z" stroke={isProjectSelectHovered ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 13C16 12.4477 16.4477 12 17 12H19C19.5523 12 20 12.4477 20 13V19C20 19.5523 19.5523 20 19 20H17C16.4477 20 16 19.5523 16 19V13Z" stroke={isProjectSelectHovered ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <span className={`text-[16px] tracking-[-0.02em] ${isProjectSelectHovered ? "font-bold text-[#00E272]" : "font-medium text-[#808080]"
                      }`}>
                      프로젝트 선택
                    </span>
                  </button>

                  {/* 로그아웃 */}
                  <button
                    className={`cursor-pointer flex items-center h-[52px] gap-4 px-7 transition-colors ${isLogoutHovered ? "bg-[rgba(214,250,232,0.3)]" : ""
                      }`}
                    onMouseEnter={() => setIsLogoutHovered(true)}
                    onMouseLeave={() => setIsLogoutHovered(false)}
                    onClick={() => {
                      clearTokens();
                      clearSelectedProjectId();
                      clearUseAttendanceMenu();
                      setOpen(false);
                      router.replace("/login");
                    }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke={isLogoutHovered ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={`text-[16px] tracking-[-0.02em] ${isLogoutHovered ? "font-bold text-[#00E272]" : "font-medium text-[#808080]"
                      }`}>
                      로그아웃
                    </span>
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



