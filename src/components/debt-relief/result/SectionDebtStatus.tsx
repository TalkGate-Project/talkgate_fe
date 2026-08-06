"use client";

import { useState } from "react";
import type { DebtStatusSummary, DiagnosisDetail } from "@/types/debtRelief";
import { formatManwonComma } from "@/components/debt-relief/format";
import DebtDetailModal from "./DebtDetailModal";

// "자세히 보기" 버튼의 돋보기 아이콘.
function DebtDetailSearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M6.66667 13.3333L9.06557 10.9344M9.06557 10.9344C9.51798 11.3868 10.143 11.6667 10.8333 11.6667C12.214 11.6667 13.3333 10.5474 13.3333 9.16667C13.3333 7.78595 12.214 6.66667 10.8333 6.66667C9.45262 6.66667 8.33333 7.78595 8.33333 9.16667C8.33333 9.85702 8.61316 10.482 9.06557 10.9344ZM17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z"
        className="stroke-[var(--secondary-20)] dark:stroke-blue-300"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-2 md:gap-[12px] min-w-0">
      <p className="text-[13px] md:text-[14px] font-medium leading-[17px] text-neutral-60">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-montserrat font-bold text-[24px] md:text-[28px] leading-7 tracking-[-0.03em] text-neutral-90">
          {value}
        </span>
        <span className="text-[13px] md:text-[14px] font-semibold leading-[17px] text-neutral-60">{unit}</span>
      </div>
    </div>
  );
}

export default function SectionDebtStatus({
  detail,
  projectId,
  onDebtApplied,
}: {
  detail: DiagnosisDetail;
  projectId: string | null;
  onDebtApplied?: () => void | Promise<void>;
}) {
  const debt: DebtStatusSummary = detail.debtStatus;
  const availableSign = debt.monthlyAvailableIncomeManwon >= 0 ? "+" : "";
  // 상세입력 모드 건에만 이자 포함 총채무가 내려온다 — 간편모드면 "총 상환 예정" 칸 자체를 숨긴다.
  const hasInterest = debt.totalDebtWithInterestManwon != null;
  const [debtDetailOpen, setDebtDetailOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground">
            채무 현황
          </h2>
          <button
            type="button"
            onClick={() => setDebtDetailOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1 h-[28px] px-2 py-1 rounded-[5px] border border-secondary-20 dark:border-secondary-40 bg-white dark:bg-neutral-10 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10 dark:hover:bg-neutral-20 whitespace-nowrap"
          >
            <DebtDetailSearchIcon />
            자세히 보기
          </button>
        </div>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* 좌: 지표
            상세모드 — 3열: 총채무(원금) / 총상환예정(이자포함) / 연체기간
                         총자산 / 월가용소득
            간편모드 — 2열: 총채무 / 연체기간
                         총자산 / 월가용소득 */}
        <div
          className={`grid gap-x-5 md:gap-x-[48px] gap-y-5 md:gap-y-6 min-w-0 md:pl-3 ${
            hasInterest ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"
          }`}
        >
          <Metric
            label={hasInterest ? "총 채무 (원금)" : "총 채무"}
            value={debt.totalDebtManwon.toLocaleString("ko-KR")}
            unit="만원"
          />
          {hasInterest && (
            <Metric
              label="총 상환 예정 (이자 포함)"
              value={debt.totalDebtWithInterestManwon!.toLocaleString("ko-KR")}
              unit="만원"
            />
          )}
          <Metric label="연체 기간" value={String(debt.overdueMonths)} unit="개월" />
          <Metric
            label="총 자산"
            value={debt.totalAssetManwon.toLocaleString("ko-KR")}
            unit="만원"
          />
          <Metric
            label="월 가용 소득"
            value={`${availableSign}${debt.monthlyAvailableIncomeManwon.toLocaleString("ko-KR")}`}
            unit="만원"
          />
        </div>

        {/* 우: 채무 구성 */}
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60 mb-[12px]">채무 구성</p>
          <div className="flex flex-col gap-[13px]">
            {debt.composition.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-[45px] shrink-0 text-[13px] font-medium leading-4 tracking-[-0.02em] text-foreground">
                  {item.label}
                </span>
                <div className="flex-1 min-w-0 h-2 rounded-full bg-neutral-30 overflow-hidden">
                  <div
                    className="h-full bg-neutral-70 rounded-l-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-[14px] font-medium leading-[17px] text-neutral-60">
                  {item.percent}%
                </span>
                <span className="w-[68px] shrink-0 text-right text-[14px] font-medium leading-[17px] text-neutral-60">
                  {formatManwonComma(item.amountManwon)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {projectId && (
        <DebtDetailModal
          open={debtDetailOpen}
          onClose={() => setDebtDetailOpen(false)}
          detail={detail}
          projectId={projectId}
          onApplied={onDebtApplied ?? (() => undefined)}
        />
      )}
    </div>
  );
}
