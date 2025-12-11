"use client";

import { useDemoMode } from "@/contexts/DemoModeContext";

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <button
      onClick={toggleDemoMode}
      className={`cursor-pointer fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 ${
        isDemoMode
          ? "bg-primary-80 text-white hover:bg-primary-70"
          : "bg-[#252525] text-white hover:bg-[#3a3a3a]"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        {isDemoMode ? (
          // 체크 아이콘
          <path
            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // 데이터베이스 아이콘
          <path
            d="M4 7V17C4 19.2091 7.58172 21 12 21C16.4183 21 20 19.2091 20 17V7M4 7C4 9.20914 7.58172 11 12 11C16.4183 11 20 9.20914 20 7M4 7C4 4.79086 7.58172 3 12 3C16.4183 3 20 4.79086 20 7M20 12C20 14.2091 16.4183 16 12 16C7.58172 16 4 14.2091 4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <span className="text-[14px] font-medium">
        {isDemoMode ? "더미 데이터 ON" : "더미 데이터로 보기"}
      </span>
    </button>
  );
}












