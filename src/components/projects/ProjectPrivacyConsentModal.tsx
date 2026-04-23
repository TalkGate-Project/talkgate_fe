"use client";

import { useEffect, useState } from "react";

import { useCreateProjectPrivacyConsent } from "@/hooks/useProjectPrivacyConsent";
import { showErrorModal } from "@/lib/errorModalEvents";
import {
  PROJECT_PRIVACY_TERMS_BODY,
  PROJECT_PRIVACY_TERMS_TITLE,
} from "@/lib/projectPrivacyTerms";

type Props = {
  projectId: string | number;
  projectName?: string;
  onConfirmed: () => void;
};

export default function ProjectPrivacyConsentModal({
  projectId,
  projectName: _projectName,
  onConfirmed,
}: Props) {
  const [agreed, setAgreed] = useState(false);
  const { mutateAsync, isPending } = useCreateProjectPrivacyConsent();

  // 모달 동안 body 스크롤 락 + ESC 차단 (임의 종료 불가)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const blockEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", blockEsc, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", blockEsc, true);
    };
  }, []);

  const handleConfirm = async () => {
    if (!agreed || isPending) return;
    try {
      await mutateAsync(projectId);
      onConfirmed();
    } catch (error) {
      console.error("Project privacy consent failed:", error);
      showErrorModal({
        type: "error",
        headline: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 배경 오버레이: 클릭해도 닫히지 않음 (다크모드에서는 blur 미사용) */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-[#000000CC]"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-privacy-consent-title"
        className="relative w-full max-w-[848px] max-h-[calc(100dvh-32px)] rounded-[14px] bg-card dark:bg-neutral-10 shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] dark:shadow-none flex flex-col overflow-hidden"
      >
        {/* 헤더 */}
        <div className="px-4 md:px-7 pt-5 md:pt-6">
          <h2
            id="project-privacy-consent-title"
            className="text-[18px] font-semibold leading-[21px] text-foreground"
          >
            개인정보 처리 위탁 계약 동의
          </h2>
        </div>

        {/* 서브카피 */}
        <div className="px-4 md:px-7 mt-5 md:mt-[30px]">
          <p className="text-center text-[14px] font-medium leading-[17px] text-foreground">
            약관에 대한 동의를 완료해주세요.
          </p>
        </div>

        {/* 본문 영역 (모바일에서는 가변 높이, 데스크톱에서는 고정 높이) */}
        <div className="flex-1 min-h-0 flex flex-col px-4 md:px-7 mt-4 md:mt-[30px]">
          {/* 약관 본문 박스: container padding 12/8 (상하 12px, 좌우 8px) - 스크롤바 여유 공간용 */}
          <div className="rounded-[5px] bg-neutral-10 dark:bg-neutral-25 py-3 px-2 md:h-[193px] flex-1 md:flex-none min-h-0">
            <div className="privacy-consent-scroll h-full min-h-0 overflow-y-auto pr-2">
              <div className="px-4 text-[14px] font-medium leading-[24px] text-foreground">
                {PROJECT_PRIVACY_TERMS_TITLE}
              </div>
              <div className="mt-2 px-4 text-[14px] font-medium leading-[17px] text-neutral-60 whitespace-pre-line">
                {PROJECT_PRIVACY_TERMS_BODY}
              </div>
            </div>
          </div>

          {/* 동의 체크 박스 */}
          <label className="mt-4 md:mt-5 flex items-center gap-4 cursor-pointer select-none rounded-[5px] bg-neutral-10 dark:bg-neutral-25 px-4 md:px-6 py-3 md:h-[48px]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="sr-only peer"
            />
            <span aria-hidden className="w-6 h-6 flex-shrink-0">
              {agreed ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="24" height="24" rx="5" fill="#00E272" />
                  <path
                    d="M5 13L9 17L19 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="1"
                    width="22"
                    height="22"
                    rx="5"
                    fill="#FFFFFF"
                    className="dark:fill-neutral-20"
                    stroke="#D0D0D0"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </span>
            <span className="text-[14px] font-medium leading-[24px] text-foreground">
              개인정보 처리 위탁 계약에 동의합니다.{" "}
              <span className="text-primary-80">(필수)</span>
            </span>
          </label>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-4 md:mt-[30px] border-t border-neutral-30 px-4 md:px-7 pt-3 pb-3 md:pb-3 flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!agreed || isPending}
            className="cursor-pointer h-[34px] min-w-[66px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "처리 중..." : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
