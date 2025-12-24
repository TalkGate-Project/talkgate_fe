"use client";

import { useCallback } from "react";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import {
  usePhoneVerification,
  type VerificationResult,
} from "@/hooks/usePhoneVerification";

type PhoneVerificationStepProps = {
  onComplete: () => void;
  onSkip: () => void;
  guideMessage?: string; // 안내 문구 커스터마이징
  isInviteFlow?: boolean; // 초대 플로우인지 여부
};

export function PhoneVerificationStep({ 
  onComplete, 
  onSkip,
  guideMessage = "회원가입을 진행해주세요.",
  isInviteFlow = false,
}: PhoneVerificationStepProps) {
  // 본인인증 성공 핸들러
  const handleVerificationSuccess = useCallback(
    (result: VerificationResult) => {
      console.log("[PhoneVerificationStep] ✅ 본인인증 성공:", result);
      onComplete();
    },
    [onComplete]
  );

  // 본인인증 실패 핸들러
  const handleVerificationError = useCallback((result: VerificationResult) => {
    console.error("[PhoneVerificationStep] 본인인증 실패:", result);

    // 이미 본인인증이 완료된 경우
    if (result.code === "IDENTITY_VERIFICATION_ALREADY_EXISTS") {
      // 소셜 로그인 + 초대 플로우인 경우: 특별 안내 후 자동 건너뛰기
      if (isInviteFlow) {
        showErrorModal({
          type: "info",
          headline: "이미 본인인증이 완료된 계정입니다.",
          description: "본인인증 정보 변경은 가입 후 프로필 설정에서 가능합니다.\n다음 단계로 자동 진행됩니다.",
          hideCancel: true,
          confirmText: "확인",
          onConfirm: () => {
            // 모달 확인 후 건너뛰기로 다음 단계 진행
            onSkip();
          },
        });
      } else {
        // 일반 소셜 로그인의 경우: 기존 안내만 표시
        showErrorModal({
          type: "info",
          headline: "이미 본인인증이 완료되었습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
        // 이미 완료된 경우에도 다음 단계로 진행
        onComplete();
      }
      return;
    }

    // 팝업 차단된 경우
    if (result.code === "POPUP_BLOCKED") {
      showErrorModal({
        type: "error",
        headline: "팝업이 차단되었습니다.",
        description: "브라우저 설정에서 팝업 차단을 해제해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }

    // 기타 오류
    showErrorModal({
      type: "error",
      headline: "본인인증에 실패했습니다.",
      description: "잠시 후 다시 시도해주세요.",
      hideCancel: true,
      confirmText: "확인",
    });
  }, [isInviteFlow, onSkip, onComplete]);

  // 본인인증 훅 사용 (소셜 로그인 후에는 이미 쿠키에 토큰이 있으므로 accessToken 전달 불필요)
  const { startVerification, isVerifying } = usePhoneVerification({
    type: "account",
    onSuccess: handleVerificationSuccess,
    onError: handleVerificationError,
  });

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
        onClick={startVerification}
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

