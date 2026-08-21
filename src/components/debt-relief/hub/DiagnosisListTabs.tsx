"use client";

import type { DiagnosisListTab } from "@/hooks/useDebtReliefHub";

const TABS: { key: DiagnosisListTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "rejected", label: "반려" },
];

type Props = {
  value: DiagnosisListTab;
  onChange: (next: DiagnosisListTab) => void;
  /**
   * card: 하단 카드 상단 좌측에 자연스럽게 이어붙는 브라우저탭 스타일(데스크톱, 고정폭 120px).
   * pill: 풀폭 2등분 브라우저탭 스타일(모바일). 선택된 탭에만 1px 테두리(#EDEDED)가 붙는다.
   */
  variant?: "card" | "pill";
};

/**
 * 전체/반려 탭. 두 variant 모두 선택된 탭이 카드와 동일한 배경(bg-card)이라
 * 하단 카드와 자연스럽게 이어붙어 보인다.
 */
export default function DiagnosisListTabs({ value, onChange, variant = "card" }: Props) {
  if (variant === "pill") {
    return (
      <div className="flex w-full h-10" role="tablist" aria-label="목록 상태">
        {TABS.map((tab) => {
          const selected = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.key)}
              className={`cursor-pointer flex-1 flex items-center justify-center rounded-t-[8px] text-[14px] leading-[17px] transition-colors ${
                selected
                  ? "bg-card border border-neutral-20 font-bold text-neutral-90"
                  : "bg-neutral-20 font-medium text-neutral-60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1" role="tablist" aria-label="목록 상태">
      {TABS.map((tab) => {
        const selected = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={`cursor-pointer w-[120px] h-[40px] flex items-center justify-center rounded-t-[14px] text-[16px] leading-[19px] transition-colors ${
              selected
                ? "bg-card font-bold text-foreground"
                : "bg-neutral-20 font-medium text-neutral-60"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
