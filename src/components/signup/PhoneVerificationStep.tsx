"use client";

import { useState } from "react";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type PhoneVerificationStepProps = {
  onComplete: () => void;
  onSkip: () => void;
  guideMessage?: string; // 안내 문구 커스터마이징
};

export function PhoneVerificationStep({ 
  onComplete, 
  onSkip,
  guideMessage = "회원가입을 진행해주세요.",
}: PhoneVerificationStepProps) {
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
    } catch (err: unknown) {
      console.error("[PhoneVerification] 본인인증 실패:", err);
      showErrorModal({
        type: "error",
        headline: "본인인증에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full">
      {/* 안내 문구 */}
      <div className="text-[#FDFDFD] text-[14px] leading-[1] text-center tracking-[-0.02em] mb-[30px]">
        {guideMessage}
      </div>

      {/* 본인인증 버튼 - 피그마 디자인 적용 */}
      <button
        type="button"
        className="cursor-pointer w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold flex items-center justify-center gap-[10px] hover:bg-[#2F2F2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            y="2.5"
            width="10"
            height="15"
            rx="2"
            stroke="#B0B0B0"
            strokeWidth="1.5"
          />
          <line
            x1="8"
            y1="14.5"
            x2="12"
            y2="14.5"
            stroke="#B0B0B0"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {isVerifying ? "인증 중..." : "휴대폰 본인인증"}
      </button>

      {/* 건너뛰기 - 피그마 디자인 적용 */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="cursor-pointer text-[14px] text-[#808080] hover:text-[#BFBFBF] transition-colors flex items-center gap-1"
          onClick={onSkip}
          disabled={isVerifying}
        >
          <span>건너뛰기</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#808080]"
          >
            <path
              d="M5 3.5L8.5 7L5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 3.5L12 7L8.5 10.5"
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

