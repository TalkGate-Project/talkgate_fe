"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setTokens } from "@/lib/token";
import AsyncButton from "@/components/common/AsyncButton";
import type { SignupTokens } from "@/types/signup";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import {
  usePhoneVerification,
  type VerificationResult,
} from "@/hooks/usePhoneVerification";

type ProfileStepProps = {
  tokens: SignupTokens;
  onComplete: () => void;
  onSkip: () => void;
};

export function ProfileStep({ tokens, onComplete, onSkip }: ProfileStepProps) {
  const queryClient = useQueryClient();
  const [isSkipping, setIsSkipping] = useState(false);

  // 토큰을 쿠키에 저장하고 React Query 캐시를 무효화하는 공통 함수
  const saveTokensAndInvalidateCache = useCallback(async () => {
    setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    // 이전 유저 정보 캐시를 제거하고 새 유저 정보로 갱신
    await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
  }, [tokens, queryClient]);

  // 본인인증 성공 핸들러
  const handleVerificationSuccess = useCallback(
    async (result: VerificationResult) => {
      console.log("[ProfileStep] ✅ 본인인증 성공:", result);

      // 토큰 저장 및 캐시 무효화
      await saveTokensAndInvalidateCache();
      onComplete();
    },
    [saveTokensAndInvalidateCache, onComplete]
  );

  // 본인인증 실패 핸들러
  const handleVerificationError = useCallback((result: VerificationResult) => {
    console.error("[ProfileStep] 본인인증 실패:", result);

    // 이미 본인인증이 완료된 경우
    if (result.code === "IDENTITY_VERIFICATION_ALREADY_EXISTS") {
      showErrorModal({
        type: "info",
        headline: "이미 본인인증이 완료되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
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
  }, []);

  // 본인인증 훅 사용
  // 회원가입 직후에는 아직 토큰이 쿠키에 없으므로 accessToken을 직접 전달
  const { startVerification, isVerifying } = usePhoneVerification({
    type: "account",
    accessToken: tokens.accessToken,
    onSuccess: handleVerificationSuccess,
    onError: handleVerificationError,
  });

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // 건너뛰기 시에는 본인인증 없이 토큰만 저장 및 캐시 무효화
      await saveTokensAndInvalidateCache();
      onSkip();
    } finally {
      setIsSkipping(false);
    }
  };

  const isLoading = isVerifying || isSkipping;

  return (
    <div className="w-full mt-8">
      {/* 안내 문구 */}
      <div className="text-[#FDFDFD] text-[14px] leading-[1] text-center tracking-[-0.02em] mb-[30px]">
        회원가입을 진행해주세요.
      </div>

      {/* 본인인증 버튼 - 피그마 디자인 적용 */}
      <AsyncButton
        type="button"
        variant="auth"
        size="md"
        fullWidth
        loading={isVerifying}
        disabled={isLoading}
        loadingText="인증 중..."
        onClick={startVerification}
        leftIcon={
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
        }
      >
        휴대폰 본인인증
      </AsyncButton>

      {/* 건너뛰기 - 피그마 디자인 적용 */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="cursor-pointer text-[14px] text-[#808080] hover:text-[#BFBFBF] transition-colors flex items-center gap-1"
          onClick={handleSkip}
          disabled={isLoading}
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


