"use client";

import { useState } from "react";

interface SelfAuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verificationToken: string) => void;
  purpose: "personal" | "common"; // 개인 발신번호 or 공통 발신번호 추가
}

export default function SelfAuthenticationModal({
  isOpen,
  onClose,
  onSuccess,
  purpose,
}: SelfAuthenticationModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      // TODO: 실제 본인인증 API 연동
      // 여기서는 임시로 더미 토큰을 생성합니다
      // 실제로는 본인인증 서비스(PASS, NICE 등)와 연동하여 토큰을 받아야 합니다
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 인증 시뮬레이션

      const dummyVerificationToken = `verification_token_${Date.now()}`;
      onSuccess(dummyVerificationToken);
    } catch (error) {
      console.error("본인인증 실패:", error);
      alert("본인인증에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getTitle = () => {
    return "본인인증";
  };

  const getMainText = () => {
    return "발신번호 등록을 위해 본인인증을 진행해주세요.";
  };

  const getSubText = () => {
    if (purpose === "personal") {
      return "본인인증이 완료되면 자동으로 발신번호에 추가됩니다.";
    }
    return null; // 공통 발신번호 추가시에는 하단 문구 숨김
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-[440px] bg-card dark:bg-neutral-10 rounded-[14px] mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5">
          <h2 className="text-[18px] font-bold text-ink dark:text-neutral-80 leading-[1.4]">
            {getTitle()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-20 dark:hover:bg-neutral-20 transition-colors"
            aria-label="닫기"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-7 pb-[30px]">
          {/* Icon */}
          <div className="mb-4">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 20L18.3333 23.3333L25 16.6667M35 20C35 28.2843 28.2843 35 20 35C11.7157 35 5 28.2843 5 20C5 11.7157 11.7157 5 20 5C28.2843 5 35 11.7157 35 20Z" stroke="#00E272" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Main Text */}
          <p className="text-[18px] font-semibold text-ink dark:text-neutral-80 leading-[1.5] text-center mb-2">
            {getMainText()}
          </p>

          {/* Sub Text - 개인 발신번호 추가시에만 표시 */}
          {getSubText() && (
            <p className="text-[14px] text-neutral-60 dark:text-neutral-60 leading-[1.6] text-center">
              {getSubText()}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-30 dark:border-neutral-30" />

        {/* Actions */}
        <div className="flex gap-2 justify-end px-7 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAuthenticating}
            className="cursor-pointer w-[48px] h-[34px] flex items-center justify-center rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10 text-[13px] font-medium text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="cursor-pointer w-[72px] h-[34px] flex items-center justify-center rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[13px] font-medium text-neutral-0 dark:text-neutral-90 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? "인증 중..." : "인증하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
