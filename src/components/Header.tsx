"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="fixed top-0 left-0 right-0 h-[54px] bg-[#252525] z-50">
      <div className="mx-auto max-w-[1324px] w-full h-full px-0 flex items-center">
        {/* Brand (left) */}
        <div className="flex items-center h-full">
          <Link href="/" className="text-white text-[16px] font-semibold tracking-[-0.02em]">
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

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#808080] grid place-items-center">
            <span className="text-white text-[14px] font-semibold leading-[17px] tracking-[-0.02em]">
              김
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}


