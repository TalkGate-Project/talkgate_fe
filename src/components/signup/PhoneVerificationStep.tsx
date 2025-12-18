"use client";

import { useState } from "react";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type PhoneVerificationStepProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function PhoneVerificationStep({ onComplete, onSkip }: PhoneVerificationStepProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerification = async () => {
    setIsVerifying(true);
    try {
      // TODO: 실제 본인인증 서비스(PASS, NICE 등) 연동
      // 현재는 임시로 시뮬레이션
      console.log("[PhoneVerification] 📱 본인인증 시작");
      
      // 임시: 본인인증 팝업/리다이렉트 시뮬레이션
      // 실제 구현 시에는 window.open 또는 SDK 호출
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // 본인인증 성공 시 API 호출
      // await AuthService.verifyPhone({ verificationToken: "..." });
      
      console.log("[PhoneVerification] ✅ 본인인증 완료");
      onComplete();
    } catch (err: any) {
      console.error("[PhoneVerification] 본인인증 실패:", err);
      showErrorModal({
        title: "오류 발생",
        headline: "본인인증에 실패했습니다.",
        description: err?.data?.message || "잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full">
      {/* 안내 문구 */}
      <div className="text-[#FDFDFD] text-[14px] leading-[1] text-center tracking-[-0.02em] mb-[30px]">
        회원가입을 진행해주세요.
      </div>

      {/* 본인인증 버튼 */}
      <button
        type="button"
        className="cursor-pointer w-full h-[48px] rounded-[5px] border border-[#555555] bg-transparent text-[#D0D0D0] text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[#2F2F2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleVerification}
        disabled={isVerifying}
      >
        {/* 스마트폰 아이콘 */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="2"
            width="10"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="8"
            y1="15"
            x2="12"
            y2="15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {isVerifying ? "인증 중..." : "휴대폰 본인인증"}
      </button>

      {/* 건너뛰기 */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="cursor-pointer text-[13px] text-[#808080] hover:text-[#BFBFBF] transition-colors flex items-center gap-1"
          onClick={onSkip}
          disabled={isVerifying}
        >
          건너뛰기
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 4L14 8L10 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

