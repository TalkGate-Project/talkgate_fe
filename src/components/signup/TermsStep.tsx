"use client";

import { useState } from "react";
import Checkbox from "@/components/common/Checkbox";
import { AuthService } from "@/services/auth";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type TermsStepProps = {
  onComplete: () => void;
};

export function TermsStep({ onComplete }: TermsStepProps) {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAgreed = agreeTerms && agreePrivacy;

  const handleSubmit = async () => {
    if (!allAgreed) return;

    setIsSubmitting(true);
    try {
      // 약관 동의 API 호출
      await AuthService.termsAccept();
      console.log("[TermsStep] ✅ 약관 동의 완료");
      onComplete();
    } catch (err: any) {
      console.error("[TermsStep] 약관 동의 실패:", err);
      showErrorModal({
        title: "오류 발생",
        headline: "약관 동의에 실패했습니다.",
        description: err?.data?.message || "잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {/* 안내 문구 */}
      <div className="text-[#FDFDFD] text-[14px] leading-[1] text-center tracking-[-0.02em] mb-[30px]">
        회원가입을 진행해주세요.
      </div>

      {/* 약관 동의 영역 */}
      <div className="mb-6">
        <div className="flex items-center text-[14px] text-[#BFBFBF]">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allAgreed}
              onChange={(next) => {
                setAgreeTerms(next);
                setAgreePrivacy(next);
              }}
              ariaLabel="모두 동의합니다"
            />
            <span>모두 동의합니다</span>
          </div>
          <button
            type="button"
            className="cursor-pointer ml-[12px] flex items-center justify-center"
            onClick={() => setShowTerms(!showTerms)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-200 ${
                showTerms ? "rotate-180" : ""
              }`}
            >
              <path
                d="M15.8337 7.5L10.0003 13.3333L4.16699 7.5"
                stroke="#959595"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {showTerms && (
          <div className="mt-2 pl-6 space-y-2">
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeTerms}
                onChange={setAgreeTerms}
                ariaLabel="이용약관 동의"
              />
              <span>이용약관에 동의합니다 (필수)</span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreePrivacy}
                onChange={setAgreePrivacy}
                ariaLabel="개인정보 처리방침 동의"
              />
              <span>개인정보처리방침에 동의합니다 (필수)</span>
            </div>
          </div>
        )}

        {/* 미동의 경고 */}
        {!allAgreed && (
          <div className="mt-3 text-[13px] text-[#808080]">
            서비스 이용을 위해 약관에 동의해주세요.
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      <button
        type="submit"
        className="cursor-pointer w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!allAgreed || isSubmitting}
      >
        {isSubmitting ? "처리 중..." : "다음"}
      </button>
    </form>
  );
}

