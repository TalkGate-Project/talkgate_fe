"use client";

import { useEffect, useRef, useState } from "react";
import {
  DIAGNOSIS_STATUS_DISTRIBUTION_ORDER,
  DIAGNOSIS_STATUS_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type DiagnosisHubSummary,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import SortIcon from "@/components/common/SortIcon";
import { STATUS_BADGE_STYLE } from "@/components/debt-relief/DiagnosisBadges";
import { formatWonAsManwonCompact, formatWonAsManwonNumber } from "@/components/stats/fee/feeFormat";

// 카드 외곽은 공통(304×148 비율)이되, 안쪽 콘텐츠 영역 너비·높이는 카드마다 다름 (피그마 Group 치수).
// 모바일(< md)은 카드 높이를 96px로 제한하고 내용이 넘치면 카드 내부에서 세로 스크롤한다.
// 모바일 라운드는 8px(피그마 375px 프레임 기준), md부터 기존 14px.
const CARD_BASE =
  "bg-neutral-10 rounded-[8px] px-4 py-3 md:rounded-[14px] md:px-7 max-h-24 overflow-y-auto md:h-[148px] md:max-h-none md:overflow-visible flex flex-col min-h-0";
// 1~3번 카드: 상하 패딩 22px(데스크톱)
const CARD_CLASS = `${CARD_BASE} md:py-[22px]`;
// 진행단계만 하단 패딩 14px — 공통 py를 쓰지 않고 pt/pb를 분리해 다른 카드에 영향 없게 함
const CARD_PROGRESS_CLASS = `${CARD_BASE} md:pt-[22px] md:pb-3.5`;

const LABEL_CLASS = "text-[14px] font-medium leading-[17px] text-neutral-60 shrink-0";

// 375px 미만은 한 줄에 카드 1개, 375px부터(피그마 모바일 기준) 2×2 — 카드 156px에 맞춰 gap 16px,
// lg(1080px)부터 4열 + gap 20px. md(780px)에서 바로 4열로 가면 780~1079px 구간에서 카드 폭이
// 진행단계 라벨보다 좁아져 텍스트가 "1단..." 식으로 과도하게 잘리는 문제가 있어(DashboardPageContent의
// grid-cols-2 md:grid-cols-2 lg:grid-cols-4 컨벤션과 동일하게 lg로 늦춤).
const SUMMARY_GRID_CLASS = "grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5";

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
        className="cursor-pointer inline-flex items-center justify-center gap-1 md:gap-2 h-[18px] md:h-6 min-w-[54px] md:min-w-[71px] px-1.5 py-1 md:py-2 rounded border border-neutral-30 bg-card"
      >
        <span className="text-[8px] md:text-[12px] font-medium leading-[10px] md:leading-[14px] tracking-[-0.02em] text-foreground whitespace-nowrap">
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

  // 바 채움 비율은 "이 카드 안 최댓값 대비"가 아니라 "전체 건수 대비 이 상태가 차지하는 비율"이어야 한다.
  const totalStatusCount = Math.max(
    1,
    DIAGNOSIS_STATUS_DISTRIBUTION_ORDER.reduce((sum, key) => sum + summary.statusDistribution[key], 0)
  );
  const progressSteps = summary.progressStepsByProcedure[selectedProcedure] ?? [];
  const monthlyPaymentAmountRatio =
    summary.monthlyPayment.totalAmount > 0
      ? Math.min(100, Math.max(0, (summary.monthlyPayment.paidAmount / summary.monthlyPayment.totalAmount) * 100))
      : 0;

  return (
    <div className={SUMMARY_GRID_CLASS}>
      {/* 총 분석 건수 — 안쪽 콘텐츠 ~80×96 (좌측 정렬, 좁은 블록) */}
      <div className={CARD_CLASS}>
        <p className={LABEL_CLASS}>총 분석 건수</p>
        <div className="mt-2 md:mt-3 flex flex-col w-fit max-w-full md:h-[62px] md:justify-between">
          <p className="flex items-end gap-1.5">
            <span className="font-montserrat font-bold text-[20px] md:text-[28px] leading-none tracking-[-0.04em] text-neutral-90">
              {summary.totalAnalysisCount.toLocaleString("ko-KR")}
            </span>
            <span className="text-[12px] md:text-[16px] font-semibold leading-[14px] md:leading-[19px] text-neutral-90 pb-0 md:pb-1.5">
              건
            </span>
          </p>
          <p className="text-[12px] md:text-[16px] font-medium leading-[14px] md:leading-[19px] text-neutral-60 mt-2 md:mt-0">
            이번 달 {summary.thisMonthCount}건
          </p>
        </div>
      </div>

      {/* 이번 달 결제 — 안쪽 콘텐츠 ~248×96 (금액/건수 + 프로그레스 바 풀폭) */}
      <div className={CARD_CLASS}>
        <p className={LABEL_CLASS}>이번 달 결제</p>
        <div className="mt-2 md:mt-[17px] flex flex-col flex-1 min-h-0 w-full md:max-w-[248px]">
          {/* 원 단위 그대로면 자리수가 길어져 모바일에서 줄바꿈이 어색해져 만원 단위(내림)로 축약 표시.
              "/"가 줄바꿈 시 혼자 남지 않도록 "/ 총액"을 한 덩어리로 묶어서 wrap 단위로 취급 */}
          <p className="flex items-end gap-1 flex-wrap">
            <span className="font-montserrat font-bold text-[20px] md:text-[28px] leading-none tracking-[-0.04em] text-neutral-90">
              {formatWonAsManwonNumber(summary.monthlyPayment.paidAmount)}
            </span>
            <span className="font-montserrat font-semibold text-[12px] md:text-[18px] leading-[15px] md:leading-[22px] tracking-[-0.02em] text-neutral-60">
              만원
            </span>
            <span className="inline-flex items-end gap-1">
              <span className="font-montserrat font-medium text-[12px] md:text-[18px] leading-[15px] md:leading-[22px] tracking-[-0.02em] text-neutral-60">
                /
              </span>
              <span className="font-montserrat font-semibold text-[12px] md:text-[18px] leading-[15px] md:leading-[22px] tracking-[-0.02em] text-neutral-60">
                {formatWonAsManwonCompact(summary.monthlyPayment.totalAmount)}
              </span>
            </span>
          </p>
          <div className="mt-auto pt-3 md:pt-0">
            <div className="h-1.5 md:h-2 w-full rounded-[30px] bg-neutral-30 overflow-hidden">
              <div
                className="h-full rounded-l-[30px] bg-primary-40"
                style={{ width: `${monthlyPaymentAmountRatio}%` }}
              />
            </div>
            <p className="mt-1 md:mt-2 text-[10px] md:text-[13px] font-medium leading-[12px] md:leading-[14px] text-neutral-50">
              {summary.monthlyPayment.paidCount}/{summary.monthlyPayment.totalCount}건 납부 완료
            </p>
          </div>
        </div>
      </div>

      {/* 상태 분포 — 안쪽 콘텐츠 ~248×104 (칩+바 행, gap 8, 항목이 많으면 내부 스크롤) */}
      <div className={CARD_CLASS}>
        <p className={LABEL_CLASS}>상태 분포</p>
        <div
          className="mt-1 md:mt-3 flex flex-col gap-1 md:gap-2 overflow-y-auto w-full md:max-w-[248px] md:h-[76px] pr-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#D0D0D0 transparent" }}
        >
          {DIAGNOSIS_STATUS_DISTRIBUTION_ORDER.map((key) => {
            const count = summary.statusDistribution[key];
            return (
              <div key={key} className="flex items-center gap-3 h-[14px] md:h-5 shrink-0">
                {/* 칩 자체는 내용에 맞춰 좁아지되(짧은 라벨이 불필요하게 넓어지지 않게), 이 칩을 담는
                    슬롯은 가장 긴 라벨("절차진행중"/"계약대기중") 기준 고정폭으로 둬서 슬롯 뒤에 오는
                    바의 시작 위치가 행마다 흔들리지 않도록 한다. */}
                <div className="shrink-0 md:w-[60px]">
                  <span
                    className={`inline-flex items-center justify-center h-[14px] px-1 rounded-[5px] text-[8px] leading-[10px] md:h-[18px] md:px-1 md:text-[12px] md:leading-[14px] font-medium opacity-80 whitespace-nowrap ${STATUS_BADGE_STYLE[key]}`}
                  >
                    {DIAGNOSIS_STATUS_LABEL[key]}
                  </span>
                </div>
                <div className="w-full max-w-[140px] min-w-0 h-1 md:h-1.5 rounded-[30px] bg-neutral-30 overflow-hidden">
                  <div
                    className="h-full rounded-l-[30px] bg-neutral-70"
                    style={{ width: `${(count / totalStatusCount) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] md:text-[12px] font-medium leading-[12px] md:leading-[14px] text-neutral-60 shrink-0 whitespace-nowrap text-right">
                  {count}건
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 진행단계 — 절차 셀렉트 + 스크롤 목록 (모바일·데스크톱 모두 높이 제한 후 내부 스크롤) */}
      <div className={`${CARD_PROGRESS_CLASS} min-h-0`}>
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-0.5 min-w-0">
            <p className={LABEL_CLASS}>진행단계</p>
            <SortIcon state="none" className="-ml-0.5 shrink-0" />
          </div>
          <ProgressProcedureSelect value={selectedProcedure} onChange={setSelectedProcedure} />
        </div>
        <div
          className="mt-1 md:mt-3 flex flex-col gap-1 md:gap-3 overflow-y-auto w-full md:max-w-[248px] h-[76px] pr-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#D0D0D0 transparent" }}
        >
          {progressSteps.length === 0 ? (
            <p className="text-[10px] md:text-[12px] font-medium leading-[12px] md:leading-[14px] text-neutral-50">
              표시할 진행단계가 없습니다.
            </p>
          ) : (
            progressSteps.map(({ step, title, count }) => (
              <div
                key={`${selectedProcedure}-${step}-${title ?? ""}`}
                className="flex items-center justify-between h-[14px] md:h-4 shrink-0 gap-2"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 bg-secondary-20" aria-hidden />
                  <span className="text-[10px] md:text-[14px] font-medium leading-[12px] md:leading-4 tracking-[-0.02em] text-neutral-90 truncate">
                    {title ? `${step}단계. ${title}` : `${step}단계`}
                  </span>
                </span>
                <span className="text-[10px] md:text-[12px] font-medium leading-[12px] md:leading-[14px] text-neutral-60 shrink-0 text-right">
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
