"use client";

import { useState } from "react";
import type { DiagnosisDerivedValues, DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepMeta } from "./steps";
import FormCustomerSummary from "./FormCustomerSummary";
import FormFinancialSummary from "./FormFinancialSummary";
import FormStepChecklist from "./FormStepChecklist";

/** Figma 모바일 분석하기 — 18×18 프레임, 아이콘 14 영역, green→mint 그라디언트 */
function MobileAnalyzeSparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9.38432 15.6434L9.37588 15.6447L9.32595 15.6672L9.31188 15.6697L9.30204 15.6672L9.2521 15.6441C9.2446 15.6423 9.23897 15.6436 9.23522 15.6479L9.23241 15.6543L9.22045 15.929L9.22397 15.9418L9.231 15.9502L9.30414 15.9977L9.31469 16.0002L9.32313 15.9977L9.39627 15.9502L9.40471 15.9399L9.40753 15.929L9.39557 15.655C9.3937 15.6481 9.38995 15.6443 9.38432 15.6434ZM9.56998 15.5709L9.56014 15.5722L9.43074 15.6319L9.4237 15.6383L9.42159 15.6453L9.43425 15.9213L9.43777 15.929L9.44339 15.9341L9.58475 15.9932C9.59366 15.9953 9.60046 15.9936 9.60515 15.9881L9.60796 15.9791L9.58405 15.585C9.58171 15.5769 9.57702 15.5722 9.56998 15.5709ZM9.06714 15.5722C9.06404 15.5705 9.06034 15.5699 9.0568 15.5706C9.05326 15.5713 9.05016 15.5733 9.04815 15.576L9.04393 15.585L9.02002 15.9791C9.02049 15.9868 9.02447 15.9919 9.03198 15.9945L9.04252 15.9932L9.18388 15.9335L9.19092 15.9284L9.19303 15.9213L9.20569 15.6453L9.20358 15.6376L9.19654 15.6312L9.06714 15.5722Z"
        fill="url(#mobileAnalyzeSparkleSmall)"
      />
      <path
        d="M6.93167 4.21289C7.35223 3.08976 9.05277 3.05574 9.55139 4.11085L9.59359 4.21353L10.1611 5.72816C10.2912 6.07551 10.5014 6.39338 10.7775 6.66031C11.0536 6.92724 11.3893 7.13702 11.7618 7.27551L11.9144 7.3275L13.5742 7.84478C14.8049 8.22857 14.8422 9.78042 13.6867 10.2354L13.5742 10.274L11.9144 10.7919C11.5336 10.9105 11.1852 11.1023 10.8926 11.3543C10.5999 11.6062 10.3699 11.9126 10.2181 12.2526L10.1611 12.3912L9.59429 13.9065C9.17373 15.0296 7.4732 15.0636 6.97528 14.0092L6.93167 13.9065L6.36483 12.3919C6.23485 12.0444 6.0247 11.7264 5.74857 11.4594C5.47244 11.1923 5.13675 10.9824 4.76416 10.8439L4.61225 10.7919L2.95251 10.2746C1.72106 9.8908 1.68379 8.33896 2.83998 7.88457L2.95251 7.84478L4.61225 7.3275C4.99289 7.2088 5.34121 7.01699 5.63371 6.76501C5.92622 6.51303 6.1561 6.20673 6.30786 5.86678L6.36483 5.72816L6.93167 4.21289ZM13.8892 2C14.0208 2 14.1497 2.03368 14.2614 2.09721C14.373 2.16075 14.4629 2.25158 14.5208 2.3594L14.5545 2.43449L14.8007 3.09297L15.523 3.31759C15.6548 3.35847 15.7704 3.43415 15.8551 3.53504C15.9397 3.63593 15.9897 3.75749 15.9986 3.88431C16.0075 4.01113 15.9749 4.1375 15.905 4.24741C15.8351 4.35732 15.731 4.44582 15.6059 4.5017L15.523 4.5325L14.8014 4.75713L14.5552 5.41625C14.5104 5.53654 14.4274 5.64196 14.3168 5.71917C14.2062 5.79637 14.073 5.84188 13.934 5.84992C13.795 5.85796 13.6566 5.82818 13.5362 5.76434C13.4158 5.7005 13.3189 5.60549 13.2577 5.49134L13.2239 5.41625L12.9778 4.75777L12.2555 4.53314C12.1237 4.49227 12.0081 4.41659 11.9234 4.3157C11.8387 4.21481 11.7888 4.09325 11.7799 3.96643C11.771 3.83961 11.8036 3.71324 11.8735 3.60333C11.9434 3.49342 12.0475 3.40492 12.1725 3.34904L12.2555 3.31824L12.9771 3.09361L13.2232 2.43449C13.2706 2.30769 13.3604 2.19761 13.4798 2.11969C13.5992 2.04177 13.7424 1.99992 13.8892 2Z"
        fill="url(#mobileAnalyzeSparkleMain)"
      />
      <defs>
        <linearGradient id="mobileAnalyzeSparkleSmall" x1="9.31399" y1="15.5703" x2="9.31399" y2="16.0002" gradientUnits="userSpaceOnUse">
          <stop className="analyze-sparkle-start" stopColor="#00E272" />
          <stop className="analyze-sparkle-end" offset="1" stopColor="#A9FFD4" />
        </linearGradient>
        <linearGradient id="mobileAnalyzeSparkleMain" x1="9" y1="2" x2="9" y2="14.7752" gradientUnits="userSpaceOnUse">
          <stop className="analyze-sparkle-start" stopColor="#00E272" />
          <stop className="analyze-sparkle-end" offset="1" stopColor="#A9FFD4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  form: DiagnosisFormState;
  derived: DiagnosisDerivedValues;
  steps: FormStepMeta[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  /** 필수값 미충족(생성) / 변경 없음(수정)이면 true — 버튼은 유지하고 활성 효과만 숨김 */
  analyzeDisabled?: boolean;
  /** 실제 고객 레코드와 연동된 데이터면 이름 옆에 연동 아이콘을 붙인다. */
  isCustomerConnected?: boolean;
  onCustomerLink?: () => void;
  onCustomerUnlink?: () => void;
};

// 전역 헤더 54px + 하단 FormMobileActionBar(~58px, safe-area 포함)를 제외한 높이.
const DRAWER_MAX_H = "max-h-[calc(100dvh-54px-58px)]";

// 모바일 전용 상단 요약 드로어. 데스크톱 FormSidebar와 달리 상시 펼침이 아니라
// collapsed / expanded 로컬 상태를 갖는 별개 컴포넌트.
export default function MobileFormSummaryDrawer({
  form,
  derived,
  steps,
  currentIndex,
  onSelectStep,
  onAnalyze,
  analyzing,
  analyzeDisabled = false,
  isCustomerConnected = false,
  onCustomerLink,
  onCustomerUnlink,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const step = steps[currentIndex];

  const handleSelectStep = (index: number) => {
    onSelectStep(index);
    setExpanded(false);
  };

  return (
    <div
      className={`md:hidden sticky top-[54px] z-30 surface flex flex-col ${
        expanded ? DRAWER_MAX_H : ""
      }`}
    >
      {/* Figma: 헤더 영역 57px — 단계/제목/분석하기를 세로 가운데 정렬, 하단 구분선+화살표 겹침 */}
      <div className="relative shrink-0 h-[57px]">
        <div className="flex items-center gap-2 px-6 h-full">
          <span className="shrink-0 inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-neutral-20 text-[13px] font-semibold text-neutral-60">
            {currentIndex + 1}/{steps.length}
          </span>
          <h2 className="flex-1 min-w-0 truncate text-[16px] font-bold leading-[19px] text-foreground">
            {step.label}
          </h2>
          {/* Figma: 92×34, radius 5, drop-shadow, 사이드바와 동일 analyze-button */}
          <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzing}
              aria-label={analyzing ? "분석 중" : "분석하기"}
              className={`analyze-button ${!analyzeDisabled ? "analyze-button-ready" : ""} shrink-0 inline-flex items-center justify-center gap-2.5 w-[96px] h-[34px] px-3 text-[14px] leading-[17px] tracking-[-0.02em] font-semibold whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                <MobileAnalyzeSparkleIcon />
              </span>
              <span className="relative z-10">{analyzing ? "분석 중" : "분석하기"}</span>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-0 flex justify-center pointer-events-none">
          <div role="separator" className="absolute inset-x-0 top-0 h-px bg-neutral-20" />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "요약 접기" : "요약 펼치기"}
            className="pointer-events-auto relative z-10 cursor-pointer w-6 h-6 grid place-items-center rounded-full bg-card text-neutral-50 border border-neutral-30 hover:text-neutral-70 -translate-y-1/2"
          >
            <ChevronIcon expanded={expanded} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-10 px-6 pt-3 pb-5 flex flex-col gap-4">
          <FormCustomerSummary
            form={form}
            isCustomerConnected={isCustomerConnected}
            onCustomerLink={onCustomerLink}
            onCustomerUnlink={onCustomerUnlink}
          />
          <FormFinancialSummary derived={derived} className="bg-card" />
          <FormStepChecklist
            steps={steps}
            currentIndex={currentIndex}
            onSelectStep={handleSelectStep}
            form={form}
          />
        </div>
      )}
    </div>
  );
}
