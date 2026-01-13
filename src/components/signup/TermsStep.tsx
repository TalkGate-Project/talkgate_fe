"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Checkbox from "@/components/common/Checkbox";
import { AuthService } from "@/services/auth";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type TermsStepProps = {
  onComplete: () => void;
};

export function TermsStep({ onComplete }: TermsStepProps) {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeDataProcessing, setAgreeDataProcessing] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [showTerms, setShowTerms] = useState(true); // 기본으로 펼쳐진 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredAgreed = agreeTerms && agreePrivacy && agreeDataProcessing && agreeThirdParty;

  const handleSubmit = async () => {
    if (!allRequiredAgreed) return;

    setIsSubmitting(true);
    try {
      // 약관 동의 API 호출
      await AuthService.termsAccept({
        isAllowTerms: agreeTerms,
        isAllowPrivacy: agreePrivacy,
        isAllowPrivacyProcessing: agreeDataProcessing,
        isAllowCustomerInfoLegal: agreeThirdParty,
        isAllowMarketing: agreeMarketing,
      });
      console.log("[TermsStep] ✅ 약관 동의 완료");
      
      // 마케팅 정보 수신 동의 여부에 따라 알림 모달 표시
      const currentDate = format(new Date(), "yyyy년 MM월 dd일", { locale: ko });
      const marketingStatus = agreeMarketing ? "동의" : "거부";
      showErrorModal({
        type: "info",
        headline: `${currentDate} 마케팅 정보 수신 ${marketingStatus} 처리 되었습니다.`,
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          onComplete();
        },
      });
    } catch (err: any) {
      console.error("[TermsStep] 약관 동의 실패:", err);
      showErrorModal({
        type: "error",
        headline: "약관 동의에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
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
              checked={agreeTerms && agreePrivacy && agreeDataProcessing && agreeThirdParty && agreeMarketing}
              onChange={(next) => {
                setAgreeTerms(next);
                setAgreePrivacy(next);
                setAgreeDataProcessing(next);
                setAgreeThirdParty(next);
                setAgreeMarketing(next);
              }}
              ariaLabel="모두 동의합니다"
            />
            <span 
              className="cursor-pointer"
              onClick={() => {
                const next = !(agreeTerms && agreePrivacy && agreeDataProcessing && agreeThirdParty && agreeMarketing);
                setAgreeTerms(next);
                setAgreePrivacy(next);
                setAgreeDataProcessing(next);
                setAgreeThirdParty(next);
                setAgreeMarketing(next);
              }}
            >
              모두 동의합니다
            </span>
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
                ariaLabel="Talkgate 서비스 이용약관 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeTerms(!agreeTerms)}
              >
                <a
                  href="https://talkgate.im/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  Talkgate 서비스 이용약관
                </a>
                {" 동의 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreePrivacy}
                onChange={setAgreePrivacy}
                ariaLabel="개인정보처리방침 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreePrivacy(!agreePrivacy)}
              >
                <a
                  href="https://talkgate.im/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  개인정보처리방침
                </a>
                {" 동의 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeDataProcessing}
                onChange={setAgreeDataProcessing}
                ariaLabel="개인정보 처리위탁에 대한 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeDataProcessing(!agreeDataProcessing)}
              >
                <a
                  href="https://talkgate.im/privacy-consignment"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  개인정보 처리위탁
                </a>
                {"에 대한 동의 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeThirdParty}
                onChange={setAgreeThirdParty}
                ariaLabel="고객정보 적법 수집 및 제3자 제공 책임 확인"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeThirdParty(!agreeThirdParty)}
              >
                <a
                  href="https://talkgate.im/data-collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  고객정보 적법 수집 및 제3자 제공
                </a>
                {" 책임 확인 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeMarketing}
                onChange={setAgreeMarketing}
                ariaLabel="Talkgate 마케팅 정보 수신 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeMarketing(!agreeMarketing)}
              >
                <a
                  href="https://talkgate.im/marketing-consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  Talkgate 마케팅 정보 수신 동의
                </a>
                {" (선택)"}
              </span>
            </div>
          </div>
        )}

        {/* 미동의 경고 */}
        {!allRequiredAgreed && (
          <div className="mt-3 text-[13px] text-[#808080]">
            서비스 이용을 위해 약관에 동의해주세요.
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      <button
        type="submit"
        className="cursor-pointer w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!allRequiredAgreed || isSubmitting}
      >
        {isSubmitting ? "처리 중..." : "다음"}
      </button>
    </form>
  );
}

