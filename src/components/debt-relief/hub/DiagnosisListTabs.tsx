"use client";

import type { DiagnosisListTab } from "@/hooks/useDebtReliefHub";

const TABS: { key: DiagnosisListTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "rejected", label: "반려" },
];

type Props = {
  value: DiagnosisListTab;
  onChange: (next: DiagnosisListTab) => void;
};

/**
 * 전체/반려 세그먼트 탭
 * - 모바일: 카드 상단 풀폭(248px 고정 아님)
 * - 데스크톱: 248×48, 툴바 우측 끝
 */
export default function DiagnosisListTabs({ value, onChange }: Props) {
  return (
    <div
      className="flex h-12 w-full shrink-0 items-center rounded-[12px] bg-neutral-20 px-3 md:w-[248px]"
      role="tablist"
      aria-label="목록 상태"
    >
      <div className="flex w-full items-center justify-between gap-3">
        {TABS.map((tab) => {
          const selected = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.key)}
              className={`cursor-pointer flex h-[31px] flex-1 items-center justify-center rounded-[5px] px-8 text-[16px] leading-[19px] md:w-[106px] md:flex-none md:px-8 ${
                selected
                  ? "bg-card font-bold text-foreground"
                  : "bg-transparent font-medium text-neutral-60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
