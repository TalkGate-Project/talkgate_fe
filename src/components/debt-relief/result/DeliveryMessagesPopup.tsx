"use client";

import type { DiagnosisMessage } from "@/types/debtRelief";
import { DeliveryMessageTimeline } from "./SectionDeliveryMessages";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 5L15 15M5 15L15 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 모바일·태블릿(lg 미만) — AI 분석 추천 영역 위에 떠서 그 영역을 덮는 전달사항 팝업.
// PC 접이식 섹션(SectionDeliveryMessages)과 달리 펼치기/접기 없이 항상 내부 스크롤로 표시한다.
export default function DeliveryMessagesPopup({
  messages,
  onClose,
}: {
  messages: DiagnosisMessage[];
  onClose: () => void;
}) {
  return (
    <div className="lg:hidden absolute inset-x-0 top-0 z-20 rounded-[12px] border border-secondary-20 bg-card shadow-[0_13px_61px_rgba(169,169,169,0.25)] dark:border-secondary-40 dark:shadow-none">
      <div className="flex items-center justify-between border-b border-neutral-30 px-6 py-4">
        <h3 className="text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-foreground">
          전달사항
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="전달사항 닫기"
          className="cursor-pointer grid h-6 w-6 place-items-center text-neutral-50 dark:text-neutral-60"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="max-h-[320px] overflow-y-auto px-6 py-4">
        <DeliveryMessageTimeline messages={messages} />
      </div>
    </div>
  );
}
