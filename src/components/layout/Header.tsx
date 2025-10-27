"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens } from "@/lib/token";
import { clearSelectedProjectId } from "@/lib/project";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/hooks/useMe";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "대시보드", href: "/dashboard" },
  { label: "상담", href: "/consult" },
  { label: "고객목록", href: "/customers" },
  { label: "통계", href: "/stats" },
  { label: "근태", href: "/attendance" },
  { label: "공지사항", href: "/notices" },
  { label: "설정", href: "/settings" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
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

  return (
    <header className="fixed top-0 left-0 right-0 h-[54px] bg-[#252525] z-50">
      <div className="mx-auto max-w-[1324px] w-full h-full px-0 flex items-center">
        {/* Brand (left) */}
        <div className="flex items-center h-full">
          <Link href="/dashboard" className="text-white text-[16px] font-semibold tracking-[-0.02em]">
            Talkgate
          </Link>
        </div>

        {/* GNB - next to brand (left-aligned) */}
        <nav className="ml-8 flex items-center gap-[26px] h-[17px]">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-white text-[14px] leading-[17px] font-medium tracking-[-0.02em] ${
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (right) */}
        <div className="ml-auto flex items-center gap-4">
          {/* Bell with indicator */}
          <div className="relative w-6 h-6 text-white">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M14.857 17.657H9.143c-.94 0-1.714-.761-1.714-1.7 0-.36.12-.711.343-.997l.386-.494a3.43 3.43 0 00.705-2.08V9.9c0-2.318 1.88-4.2 4.2-4.2s4.2 1.882 4.2 4.2v2.486c0 .741.244 1.461.694 2.051l.386.494c.223.286.343.637.343.997 0 .939-.774 1.7-1.714 1.7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 block w-[6px] h-[6px] rounded-full bg-[#51F8A5]" />
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="w-8 h-8 rounded-full bg-[#808080] grid place-items-center"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="text-white text-[14px] font-semibold leading-[17px] tracking-[-0.02em]">
                {user?.name ? user.name.charAt(0) : "김"}
              </span>
            </button>
            {open && (
              <div className="absolute right-0 top-[65px] w-[360px] bg-white rounded-[10px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] py-5 z-50">
                {/* User Info Section */}
                <div className="flex flex-col gap-3 px-6 mb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#808080] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[18px] font-semibold leading-5 text-center tracking-[-0.02em]">
                        {user?.name ? user.name.charAt(0) : "김"}
                      </span>
                    </div>
                    
                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-[16px] font-semibold leading-5 text-[#000000] tracking-[0.2px]">
                          {user?.email || "user@kakao.com"}
                        </div>
                        <div className="w-px h-4 bg-[#808080]"></div>
                        <div className="text-[14px] font-medium leading-5 text-[#808080]">
                          A팀
                        </div>
                      </div>
                      <div className="text-[14px] font-medium leading-5 text-[#808080]">
                        UID : {user?.id || "12345"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-[#E2E2E2] mb-2.5"></div>

                {/* Menu Items */}
                <div className="flex flex-col gap-1">
                  {/* 개인설정 */}
                  <button
                    className={`flex items-center gap-4 px-7 py-5 transition-colors ${
                      isProfileHovered ? "bg-[rgba(214,250,232,0.3)]" : ""
                    }`}
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
                    <span className={`text-[16px] tracking-[-0.02em] ${
                      isProfileHovered ? "font-bold text-[#00E272]" : "font-medium text-[#808080]"
                    }`}>
                      개인설정
                    </span>
                  </button>

                  {/* 로그아웃 */}
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
                    <span className="text-[16px] font-medium text-[#808080] tracking-[-0.02em]">
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


