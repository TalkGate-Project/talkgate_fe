"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { RECOMMENDED_PROCEDURE_LABEL } from "@/types/debtRelief";
import { ANALYSIS_ADJUSTED_REPAYMENT_PERIOD_RANGE, type AnalysisAdjustedRepaymentProcedure } from "@/types/analysis";

type RepaymentValue = { monthlyPayment: number; periodMonths: number };

type Props = {
  open: boolean;
  procedure: AnalysisAdjustedRepaymentProcedure | null;
  /** 무담보 채무 합계 (만원) — 변제/면책 금액 계산 기준 */
  unsecuredDebtManwon: number;
  /** 가용소득 (만원, 음수 가능) — 월 변제액과 비교해 초과 경고에 사용 */
  disposableIncomeManwon: number;
  /** 이전에 설정한 값이 있으면(재진입 등) 그 값으로 슬라이더를 초기화한다 */
  initialValue?: RepaymentValue | null;
  onClose: () => void;
  /** "이전" — 희망 절차 선택 모달로 돌아간다 */
  onBack: () => void;
  /** "건너뛰기" — 이 절차의 변제계획 수정안 없이(분석 산출값 그대로) 제출한다 */
  onSkip: () => void;
  onConfirm: (value: RepaymentValue) => void;
};

const DEFAULT_RATE_PERCENT = 30;

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function formatManwon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}만원`;
}

export default function AnalysisAdjustedRepaymentModal({
  open,
  procedure,
  unsecuredDebtManwon,
  disposableIncomeManwon,
  initialValue,
  onClose,
  onBack,
  onSkip,
  onConfirm,
}: Props) {
  const range = procedure ? ANALYSIS_ADJUSTED_REPAYMENT_PERIOD_RANGE[procedure] : null;
  const minYears = range ? range.minMonths / 12 : 1;
  const maxYears = range ? range.maxMonths / 12 : 1;

  const [ratePercent, setRatePercent] = useState(DEFAULT_RATE_PERCENT);
  const [periodYears, setPeriodYears] = useState(maxYears);

  useEffect(() => {
    if (!open || !range) return;
    if (initialValue && unsecuredDebtManwon > 0) {
      const repaymentAmount = initialValue.monthlyPayment * initialValue.periodMonths;
      const rate = Math.min(100, Math.max(0, Math.round((repaymentAmount / unsecuredDebtManwon) * 1000) / 10));
      setRatePercent(rate);
      setPeriodYears(Math.min(range.maxMonths, Math.max(range.minMonths, initialValue.periodMonths)) / 12);
    } else {
      setRatePercent(DEFAULT_RATE_PERCENT);
      setPeriodYears(range.maxMonths / 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, procedure]);

  const derived = useMemo(() => {
    if (!range) return null;
    const repaymentAmountManwon = Math.round((unsecuredDebtManwon * ratePercent) / 100);
    const exemptAmountManwon = unsecuredDebtManwon - repaymentAmountManwon;
    const periodMonths = periodYears * 12;
    const monthlyPaymentManwon = periodMonths > 0 ? Math.round(repaymentAmountManwon / periodMonths) : 0;
    const monthlyPaymentAtMinPeriod = Math.round(repaymentAmountManwon / range.minMonths);
    const monthlyPaymentAtMaxPeriod = Math.round(repaymentAmountManwon / range.maxMonths);
    const disposableAfterPayment = disposableIncomeManwon - monthlyPaymentManwon;
    return {
      repaymentAmountManwon,
      exemptAmountManwon,
      periodMonths,
      monthlyPaymentManwon,
      monthlyPaymentAtMinPeriod,
      monthlyPaymentAtMaxPeriod,
      disposableAfterPayment,
    };
  }, [range, unsecuredDebtManwon, ratePercent, periodYears, disposableIncomeManwon]);

  if (!open || !procedure || !range || !derived) return null;

  const yearTicks = Array.from({ length: maxYears - minYears + 1 }, (_, i) => minYears + i);

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="w-[calc(100vw-2rem)] max-w-[400px] overflow-hidden rounded-[14px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.366)] drop-shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
      ariaLabel="희망 변제율 설정"
      disableAutoContainerSizing
    >
      <div className="relative px-6 pb-4 pt-6">
        <h2 className="text-[16px] font-semibold leading-[19px] text-foreground">희망 변제율 설정</h2>
        <p className="mt-2 pr-8 text-[13px] font-medium leading-5 text-neutral-60">
          {RECOMMENDED_PROCEDURE_LABEL[procedure]} · {formatManwon(unsecuredDebtManwon)} (무담보 채무 기준)
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-6 top-6 grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-6 pb-6">
        {/* 변제율 슬라이더 */}
        <div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="block text-[12px] font-medium text-neutral-60">변제</span>
              <span className="text-[18px] font-bold leading-6 text-foreground">
                {formatManwon(derived.repaymentAmountManwon)}
              </span>
              <span className="ml-1 text-[12px] font-medium text-neutral-60">{ratePercent.toFixed(1)}%</span>
            </div>
            <div className="text-right">
              <span className="block text-[12px] font-medium text-neutral-60">면책</span>
              <span className="text-[18px] font-bold leading-6 text-foreground">
                {formatManwon(derived.exemptAmountManwon)}
              </span>
              <span className="ml-1 text-[12px] font-medium text-neutral-60">{(100 - ratePercent).toFixed(1)}%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={ratePercent}
            onChange={(e) => setRatePercent(Number(e.target.value))}
            className="mt-2 w-full accent-primary-60"
            aria-label="변제율"
          />
        </div>

        {/* 월 변제액 / 기간 슬라이더 */}
        <div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="block text-[12px] font-medium text-neutral-60">월 변제액</span>
              <span className="text-[20px] font-bold leading-6 text-primary-60">
                {derived.monthlyPaymentManwon.toLocaleString("ko-KR")}
                <span className="ml-1 text-[13px] font-medium text-neutral-60">만원</span>
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[12px] font-medium text-neutral-60">기간</span>
              <span className="text-[18px] font-bold leading-6 text-foreground">{periodYears}년</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-neutral-50">
            <span>월 {derived.monthlyPaymentAtMinPeriod.toLocaleString("ko-KR")}만</span>
            <span>월 {derived.monthlyPaymentAtMaxPeriod.toLocaleString("ko-KR")}만</span>
          </div>
          <input
            type="range"
            min={minYears}
            max={maxYears}
            step={1}
            value={periodYears}
            onChange={(e) => setPeriodYears(Number(e.target.value))}
            className="mt-1 w-full accent-primary-60"
            aria-label="변제 기간(년)"
          />
          <div className="mt-1 flex justify-between text-[11px] font-medium text-neutral-50">
            {yearTicks.map((year) => (
              <span key={year}>{year}</span>
            ))}
          </div>
        </div>

        {derived.disposableAfterPayment < 0 && (
          <p className="text-[13px] font-semibold text-danger-40">
            가용소득 {derived.disposableAfterPayment.toLocaleString("ko-KR")}만원 초과
          </p>
        )}
      </div>

      <div className="flex h-[60px] items-center justify-between border-t border-neutral-30 px-6">
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-[14px] font-medium text-neutral-50 hover:text-neutral-70"
        >
          건너뛰기
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-[34px] cursor-pointer rounded-[5px] border border-neutral-30 px-3 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10"
          >
            이전
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({ monthlyPayment: derived.monthlyPaymentManwon, periodMonths: derived.periodMonths })
            }
            className="h-[34px] cursor-pointer rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:opacity-90"
          >
            분석하기
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
