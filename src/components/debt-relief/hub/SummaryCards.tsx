"use client";

import { useEffect, useRef, useState } from "react";
import {
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type DiagnosisHubSummary,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import SortIcon from "@/components/common/SortIcon";

// 카드 외곽은 공통(304×148 비율)이되, 안쪽 콘텐츠 영역 너비·높이는 카드마다 다름 (피그마 Group 치수).
const CARD_BASE =
  "bg-neutral-10 rounded-[14px] px-4 py-4 md:px-7 md:h-[148px] flex flex-col min-h-0";
// 1~3번 카드: 상하 패딩 22px
const CARD_CLASS = `${CARD_BASE} md:py-[22px]`;
// 진행단계만 하단 패딩 14px — 공통 py를 쓰지 않고 pt/pb를 분리해 다른 카드에 영향 없게 함
const CARD_PROGRESS_CLASS = `${CARD_BASE} md:pt-[22px] md:pb-3.5`;

const LABEL_CLASS = "text-[13px] md:text-[14px] font-medium leading-[17px] text-neutral-60 shrink-0";

const PROCEDURE_CHIP_STYLE: Record<RecommendedProcedure, string> = {
  individual_rehab: "bg-primary-10 text-primary-80",
  debt_adjustment: "bg-warning-10 text-warning-60",
  bankruptcy: "bg-danger-10 text-danger-40",
};

const SUMMARY_GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5";

function SummaryCardsSkeleton() {
  return (
    <div className={SUMMARY_GRID_CLASS}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={`${index === 3 ? CARD_PROGRESS_CLASS : CARD_CLASS} animate-pulse`}
        >
          <div className="h-4 w-24 bg-neutral-20 rounded mb-4" />
          <div className="h-8 w-16 bg-neutral-20 rounded" />
        </div>
      ))}
    </div>
  );
}

// 피그마: 71×24, padding 8×6, radius 4, 12px medium + 삼각형 화살표
function ProgressProcedureSelect({
  value,
  onChange,
}: {
  value: RecommendedProcedure;
  onChange: (next: RecommendedProcedure) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="cursor-pointer inline-flex items-center justify-center gap-2 h-6 min-w-[71px] px-1.5 py-2 rounded border border-neutral-30 bg-card"
      >
        <span className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-foreground whitespace-nowrap">
          {RECOMMENDED_PROCEDURE_LABEL[value]}
        </span>
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          aria-hidden
          className={`shrink-0 transition-transform ${open ? "rotate-0" : "rotate-180"}`}
        >
          <path d="M5 0.5L9.33013 7.25H0.669873L5 0.5Z" fill="currentColor" className="text-foreground" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 z-20 min-w-full rounded border border-neutral-30 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          {RECOMMENDED_PROCEDURE_ORDER.map((procedure) => {
            const isActive = procedure === value;
            return (
              <li key={procedure} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(procedure);
                    setOpen(false);
                  }}
                  className={`cursor-pointer w-full px-2.5 py-1.5 text-left text-[12px] font-medium leading-[14px] tracking-[-0.02em] whitespace-nowrap ${
                    isActive
                      ? "bg-neutral-20 text-foreground"
                      : "text-foreground hover:bg-neutral-10"
                  }`}
                >
                  {RECOMMENDED_PROCEDURE_LABEL[procedure]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SummaryCards({
  summary,
  loading,
}: {
  summary: DiagnosisHubSummary | null;
  loading: boolean;
}) {
  // 피그마 기본값: 개인회생. 깜빡임 방지를 위해 off에 해당하는 첫 옵션으로 시작해도 되지만
  // 절차 셀렉트는 항상 하나의 값이 필요하므로 기본 절차를 바로 둔다.
  const [selectedProcedure, setSelectedProcedure] =
    useState<RecommendedProcedure>("individual_rehab");

  if (loading || !summary) return <SummaryCardsSkeleton />;

  const maxProcedureCount = Math.max(
    1,
    ...RECOMMENDED_PROCEDURE_ORDER.map((key) => summary.procedureDistribution[key])
  );
  const progressSteps = summary.progressStepsByProcedure[selectedProcedure] ?? [];

  return (
    <div className={SUMMARY_GRID_CLASS}>
      {/* 총 분석 건수 — 안쪽 콘텐츠 ~80×96 (좌측 정렬, 좁은 블록) */}
      <div className={CARD_CLASS}>
        <p className={LABEL_CLASS}>총 분석 건수</p>
        <div className="mt-3 md:mt-3 flex flex-col w-fit max-w-full md:h-[62px] md:justify-between">
          <p className="flex items-end gap-1.5">
            <span className="font-montserrat font-bold text-[22px] md:text-[28px] leading-[34px] tracking-[1px] text-neutral-90">
              {summary.totalAnalysisCount.toLocaleString("ko-KR")}
            </span>
            <span className="text-[14px] md:text-[16px] font-semibold leading-[19px] text-neutral-90 pb-1.5">
              건
            </span>
          </p>
          <p className="text-[13px] md:text-[16px] font-medium leading-[19px] text-neutral-60 mt-3 md:mt-0">
            이번 달 {summary.thisMonthCount}건
          </p>
        </div>
      </div>

      {/* 평균 성공 가능성 — 안쪽 콘텐츠 ~248×96 (프로그레스 바 풀폭) */}
      <div className={CARD_CLASS}>
        <p className={LABEL_CLASS}>평균 성공 가능성</p>
        <div className="mt-3 md:mt-[17px] flex flex-col flex-1 min-h-0 w-full md:max-w-[248px]">
          <p className="flex items-baseline gap-0.5">
            <span className="font-montserrat font-bold text-[22px] md:text-[28px] leading-[34px] tracking-[1px] text-neutral-90">
              {summary.averageSuccessProbability}
            </span>
            <span className="font-montserrat font-semibold text-[15px] md:text-[18px] leading-[22px] tracking-[-0.02em] text-neutral-60">
              /100
            </span>
          </p>
          <div className="mt-auto pt-3 md:pt-0">
            <div className="h-1.5 md:h-2 w-full rounded-[30px] bg-neutral-30 overflow-hidden">
              <div
                className="h-full rounded-l-[30px] bg-primary-40"
                style={{
                  width: `${Math.min(100, Math.max(0, summary.averageSuccessProbability))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 추천 절차 분포 — 안쪽 콘텐츠 ~248×104 (칩+바 행, gap 8) */}
      <div className={CARD_CLASS}>
        <p className={LABEL_CLASS}>추천 절차 분포</p>
        <div className="mt-2.5 md:mt-3 flex flex-col gap-2 w-full md:max-w-[248px] md:h-[76px]">
          {RECOMMENDED_PROCEDURE_ORDER.map((key) => {
            const count = summary.procedureDistribution[key];
            return (
              <div key={key} className="flex items-center gap-3 h-5 shrink-0">
                <span
                  className={`inline-flex items-center justify-center h-5 px-3 rounded-[30px] text-[12px] font-medium leading-[14px] opacity-80 whitespace-nowrap shrink-0 ${PROCEDURE_CHIP_STYLE[key]}`}
                >
                  {RECOMMENDED_PROCEDURE_LABEL[key]}
                </span>
                <div className="w-full max-w-[140px] min-w-0 h-1.5 rounded-[30px] bg-neutral-30 overflow-hidden">
                  <div
                    className="h-full rounded-l-[30px] bg-neutral-70"
                    style={{ width: `${(count / maxProcedureCount) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] font-medium leading-[14px] text-neutral-60 shrink-0 whitespace-nowrap text-right">
                  {count}건
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 진행단계 — 절차 셀렉트 + 스크롤 목록 (모바일·데스크톱 모두 높이 제한 후 내부 스크롤) */}
      <div className={`${CARD_PROGRESS_CLASS} min-h-0`}>
        <div className="flex items-start justify-between gap-2 shrink-0">
          <div className="flex items-start gap-0.5 min-w-0">
            <p className={LABEL_CLASS}>진행단계</p>
            <SortIcon state="none" className="-ml-0.5 -mt-0.5 shrink-0" />
          </div>
          <ProgressProcedureSelect value={selectedProcedure} onChange={setSelectedProcedure} />
        </div>
        <div
          className="mt-2.5 md:mt-3 flex flex-col gap-3 overflow-y-auto w-full md:max-w-[248px] h-[76px] pr-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#D0D0D0 transparent" }}
        >
          {progressSteps.length === 0 ? (
            <p className="text-[12px] font-medium leading-[14px] text-neutral-50">
              표시할 진행단계가 없습니다.
            </p>
          ) : (
            progressSteps.map(({ step, title, count }) => (
              <div
                key={`${selectedProcedure}-${step}-${title ?? ""}`}
                className="flex items-center justify-between h-4 shrink-0 gap-2"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-secondary-20" aria-hidden />
                  <span className="text-[13px] md:text-[14px] font-medium leading-4 tracking-[-0.02em] text-neutral-90 truncate">
                    {title ? `${step}단계. ${title}` : `${step}단계`}
                  </span>
                </span>
                <span className="text-[12px] font-medium leading-[14px] text-neutral-60 shrink-0 text-right">
                  {count}건
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
