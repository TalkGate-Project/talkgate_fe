"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { performLogout } from "@/lib/logout";
import type { MeUser } from "@/hooks/useMe";
import { useMyMember } from "@/hooks/useMyMember";

type Props = {
  user: MeUser | null | undefined;
  variant?: "full" | "lite";
  onClose: () => void;
};

export default function UserMenuDropdown({ user, variant = "full", onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { member } = useMyMember();
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isProjectSelectHovered, setIsProjectSelectHovered] = useState(false);
  const [isPaymentHovered, setIsPaymentHovered] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  
  // 직원 정보의 이름을 우선 사용, 없으면 user.name 사용
  const displayName = member?.name || user?.name || "김직원";

  const handleProjectSelect = () => {
    onClose();
    if (variant === "full") {
      // window.location.href를 사용하여 middleware 리다이렉트 방지
      window.location.href = "/projects";
    } else {
      router.push("/projects");
    }
  };

  const handleLogout = () => {
    console.log(`[UserMenuDropdown] 🚪 로그아웃 버튼 클릭 (variant: ${variant})`);
    
    // 드롭다운 닫기
    onClose();
    
    // 통합 로그아웃 함수 사용
    // React Query 캐시도 함께 정리
    performLogout({
      queryClient,
    });
  };

  return (
    <div className="absolute -right-10 top-[50px] w-[360px] bg-card dark:bg-neutral-10 rounded-[10px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] dark:shadow-[0px_13px_61px_0px_#000000B2] py-5 z-50">
      {/* 사용자 정보 영역 */}
      <div className="flex flex-col gap-3 px-6 mb-3">
        <div className="flex items-center gap-3">
          {/* 아바타 */}
          {user?.profileImageUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={user.profileImageUrl}
                alt={user.name || "프로필"}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
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
            {variant === "full" ? (
              <>
                {/* 첫째 줄: 멤버이름 | 팀명 */}
                <div className="flex items-center gap-2">
                  <div className="text-[16px] font-semibold leading-[20px] text-foreground tracking-[0.2px]">
                    {displayName}
                  </div>
                  <div className="w-px h-4 bg-neutral-60"></div>
                  <div className="text-[14px] font-medium leading-[20px] text-neutral-60">
                    {user?.teamName || "-"}
                  </div>
                </div>
                {/* 둘째 줄: 이메일 */}
                <div className="text-[14px] font-medium leading-[20px] text-foreground">
                  {user?.email || "user@kakao.com"}
                </div>
                {/* 셋째 줄: UID */}
                <div className="text-[14px] font-medium leading-[20px] text-neutral-60">
                  UID : {user?.id || "12345"}
                </div>
              </>
            ) : (
              <>
                {/* 첫째 줄: 이메일 */}
                <div className="text-[16px] font-semibold leading-[20px] text-foreground tracking-[0.2px]">
                  {user?.email || "user@kakao.com"}
                </div>
                {/* 둘째 줄: UID */}
                <div className="text-[14px] font-medium leading-[20px] text-neutral-60">
                  UID : {user?.id || "12345"}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="w-full h-[1px] bg-border mb-2.5"></div>

      {/* 메뉴 목록 */}
      <div className="flex flex-col gap-1">
        {/* 개인 설정 */}
        <button
          className={`cursor-pointer flex items-center ${variant === "full" ? "h-[52px]" : "py-5"} gap-4 px-7 transition-colors ${
            isProfileHovered ? "bg-[var(--notification-unread-bg)]" : ""
          }`}
          onMouseEnter={() => setIsProfileHovered(true)}
          onMouseLeave={() => setIsProfileHovered(false)}
          onClick={() => {
            onClose();
            router.push("/my-settings");
          }}
        >
          <div className={`transition-colors ${isProfileHovered ? "text-primary-60" : "text-neutral-60"}`}>
            {variant === "full" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.3246 4.31731C10.751 2.5609 13.249 2.5609 13.6754 4.31731C13.9508 5.45193 15.2507 5.99038 16.2478 5.38285C17.7913 4.44239 19.5576 6.2087 18.6172 7.75218C18.0096 8.74925 18.5481 10.0492 19.6827 10.3246C21.4391 10.751 21.4391 13.249 19.6827 13.6754C18.5481 13.9508 18.0096 15.2507 18.6172 16.2478C19.5576 17.7913 17.7913 19.5576 16.2478 18.6172C15.2507 18.0096 13.9508 18.5481 13.6754 19.6827C13.249 21.4391 10.751 21.4391 10.3246 19.6827C10.0492 18.5481 8.74926 18.0096 7.75219 18.6172C6.2087 19.5576 4.44239 17.7913 5.38285 16.2478C5.99038 15.2507 5.45193 13.9508 4.31731 13.6754C2.5609 13.249 2.5609 10.751 4.31731 10.3246C5.45193 10.0492 5.99037 8.74926 5.38285 7.75218C4.44239 6.2087 6.2087 4.44239 7.75219 5.38285C8.74926 5.99037 10.0492 5.45193 10.3246 4.31731Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <span
            className={`text-[16px] tracking-[-0.02em] ${
              isProfileHovered ? "font-bold text-primary-60" : "font-medium text-neutral-60"
            }`}
          >
            개인설정
          </span>
        </button>

        {/* 프로젝트 선택 - Updated SVG v2 */}
        <button
          className={`cursor-pointer flex items-center ${variant === "full" ? "h-[52px]" : "py-5"} gap-4 px-7 transition-colors ${
            isProjectSelectHovered ? "bg-[var(--notification-unread-bg)]" : ""
          }`}
          onMouseEnter={() => setIsProjectSelectHovered(true)}
          onMouseLeave={() => setIsProjectSelectHovered(false)}
          onClick={handleProjectSelect}
        >
          <div className={`transition-colors ${isProjectSelectHovered ? "text-primary-60" : "text-neutral-60"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" key="project-select-icon">
              <path
                d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 13C4 12.4477 4.44772 12 5 12H11C11.5523 12 12 12.4477 12 13V19C12 19.5523 11.5523 20 11 20H5C4.44772 20 4 19.5523 4 19V13Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 13C16 12.4477 16.4477 12 17 12H19C19.5523 12 20 12.4477 20 13V19C20 19.5523 19.5523 20 19 20H17C16.4477 20 16 19.5523 16 19V13Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span
            className={`text-[16px] tracking-[-0.02em] ${
              isProjectSelectHovered ? "font-bold text-primary-60" : "font-medium text-neutral-60"
            }`}
          >
            프로젝트 선택
          </span>
        </button>

        {/* 결제관리 */}
        <button
          className={`cursor-pointer flex items-center ${variant === "full" ? "h-[52px]" : "py-5"} gap-4 px-7 transition-colors ${
            isPaymentHovered ? "bg-[var(--notification-unread-bg)]" : ""
          }`}
          onMouseEnter={() => setIsPaymentHovered(true)}
          onMouseLeave={() => setIsPaymentHovered(false)}
          onClick={() => {
            onClose();
            router.push("/my-settings?tab=billing");
          }}
        >
          <div className={`transition-colors ${isPaymentHovered ? "text-primary-60" : "text-neutral-60"}`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 9V7C17 5.89543 16.1046 5 15 5H5C3.89543 5 3 5.89543 3 7V13C3 14.1046 3.89543 15 5 15H7M9 19H19C20.1046 19 21 18.1046 21 17V11C21 9.89543 20.1046 9 19 9H9C7.89543 9 7 9.89543 7 11V17C7 18.1046 7.89543 19 9 19ZM16 14C16 15.1046 15.1046 16 14 16C12.8954 16 12 15.1046 12 14C12 12.8954 12.8954 12 14 12C15.1046 12 16 12.8954 16 14Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span
            className={`text-[16px] tracking-[-0.02em] ${
              isPaymentHovered ? "font-bold text-primary-60" : "font-medium text-neutral-60"
            }`}
          >
            결제관리
          </span>
        </button>

        {/* 로그아웃 - Updated SVG v2 */}
        <button
          className={`cursor-pointer flex items-center ${variant === "full" ? "h-[52px]" : "py-5"} gap-4 px-7 transition-colors ${
            isLogoutHovered ? "bg-[var(--notification-unread-bg)]" : ""
          }`}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
          onClick={handleLogout}
        >
          <div className={`transition-colors ${isLogoutHovered ? "text-primary-60" : "text-neutral-60"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 16L21 12M21 12L17 8M21 12L7 12M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            className={`text-[16px] tracking-[-0.02em] ${
              isLogoutHovered ? "font-bold text-primary-60" : "font-medium text-neutral-60"
            }`}
          >
            로그아웃
          </span>
        </button>
      </div>
    </div>
  );
}

