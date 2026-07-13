"use client";

import { useState } from "react";
import type { DiagnosisDerivedValues, DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepMeta } from "./steps";
import FormCustomerSummary from "./FormCustomerSummary";
import FormFinancialSummary from "./FormFinancialSummary";
import FormStepChecklist from "./FormStepChecklist";

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.2L8.05 5.05L11.9 6.1L8.05 7.15L7 11L5.95 7.15L2.1 6.1L5.95 5.05L7 1.2Z"
        fill="url(#mobileAnalyzeSparkle)"
      />
      <defs>
        <linearGradient id="mobileAnalyzeSparkle" x1="0" y1="0" x2="14" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E272" />
          <stop offset="1" stopColor="#3F93FF" />
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
  /** 필수값 미충족(생성) / 변경 없음(수정)이면 true — 분석하기 비활성 */
  analyzeDisabled?: boolean;
};

// 전역 헤더 54px + 하단 FormMobileActionBar(~88px, safe-area 포함)를 제외한 높이.
// sticky 드로어가 이보다 커지면 뷰포트에 잘리고 페이지 스크롤로도 내부를 볼 수 없다.
const DRAWER_MAX_H = "max-h-[calc(100dvh-54px-88px)]";

// 모바일 전용 상단 요약 드로어. 데스크톱 FormSidebar와 달리 상시 펼침이 아니라
// collapsed(스텝 표시줄만) / expanded(고객·재무 요약 + 체크리스트) 로컬 상태를 갖는
// 별개 컴포넌트다 — FormSidebar에 prop 분기를 얹지 않고 파일 자체를 분리했다.
// X 닫기는 Figma 기준으로 폼 카드 우측 상단에 두므로 이 컴포넌트에는 포함하지 않는다.
export default function MobileFormSummaryDrawer({
  form,
  derived,
  steps,
  currentIndex,
  onSelectStep,
  onAnalyze,
  analyzing,
  analyzeDisabled = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const step = steps[currentIndex];
  const disabled = analyzing || analyzeDisabled;

  // 스텝을 고르면 드로어를 접어 폼 본문이 바로 보이게 한다.
  const handleSelectStep = (index: number) => {
    onSelectStep(index);
    setExpanded(false);
  };

  return (
    <div
      className={`md:hidden sticky top-[54px] z-30 surface border-b border-neutral-20 flex flex-col ${
        expanded ? DRAWER_MAX_H : ""
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-14 shrink-0">
        <span className="shrink-0 inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-neutral-20 text-[13px] font-semibold text-neutral-60">
          {currentIndex + 1}/{steps.length}
        </span>
        <h2 className="flex-1 min-w-0 truncate text-[16px] font-bold text-foreground">{step.label}</h2>
        {/* Figma: 흰 배경 + 그라디언트 테두리 — 바깥 그라디언트 링 + 안쪽 surface 버튼 */}
        <div
          className={`shrink-0 rounded-full p-px bg-gradient-to-r from-[#A1FF8B] to-[#3F93FF] ${
            disabled ? "opacity-40" : ""
          }`}
        >
          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled}
            aria-label={analyzing ? "분석 중" : "분석하기"}
            className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 h-[34px] px-3 rounded-full bg-card text-[13px] font-semibold text-foreground"
          >
            <SparkleIcon />
            {analyzing ? "분석 중" : "분석하기"}
          </button>
        </div>
      </div>

      {/* Figma: 풀폭 바가 아니라 중앙 원형 토글 — 펼침 패널(#F8F8F8)과 맞추기 위해 neutral-10 */}
      <div className={`shrink-0 flex justify-center py-1.5 ${expanded ? "bg-neutral-10" : ""}`}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "요약 접기" : "요약 펼치기"}
          className="cursor-pointer w-6 h-6 grid place-items-center rounded-full bg-neutral-10 text-neutral-50 border border-neutral-30 hover:text-neutral-70"
        >
          <ChevronIcon expanded={expanded} />
        </button>
      </div>

      {expanded && (
        // Figma Light/Light-10 (#F8F8F8). 상단 바는 surface 유지, 펼침 패널만 배경 분리.
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-10 border-t border-neutral-30/50 px-4 pt-3 pb-5 flex flex-col gap-4">
          <FormCustomerSummary form={form} />
          {/* 펼침 패널이 neutral-10이라 재무 카드는 흰 배경으로 대비 */}
          <FormFinancialSummary derived={derived} className="bg-card" />
          <FormStepChecklist steps={steps} currentIndex={currentIndex} onSelectStep={handleSelectStep} />
        </div>
      )}
    </div>
  );
}
