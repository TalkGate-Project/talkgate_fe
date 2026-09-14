"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import BaseModal from "@/components/common/BaseModal";
import { RECOMMENDED_PROCEDURE_LABEL } from "@/types/debtRelief";
import {
  ANALYSIS_ADJUSTED_REPAYMENT_PERIOD_RANGE,
  type AnalysisAdjustedRepaymentProcedure,
} from "@/types/analysis";

export type AdjustedRepaymentValue = { monthlyPayment: number; periodMonths: number };

type Props = {
  open: boolean;
  procedure: AnalysisAdjustedRepaymentProcedure | null;
  unsecuredDebtManwon: number;
  disposableIncomeManwon: number;
  initialValue?: AdjustedRepaymentValue | null;
  /** 상세 화면처럼 초기값은 있지만 아직 조정안을 저장하지 않은 경우를 구분한다. */
  adjustmentApplied?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onReset?: () => void;
  /** 분석 입력 흐름에서 조정값 없이 바로 분석을 진행한다. */
  onSkip?: () => void;
  /** 분석 입력 흐름 전용: 이전 단계(희망 절차 선택)로 돌아간다. 있으면 좌측 하단 버튼이
   * "취소" 대신 "이전"으로 바뀌고 onClose 대신 이걸 호출한다 — 결과상세 화면(단계 체인이
   * 없는 단독 조정)에선 안 넘기므로 거긴 그대로 "취소". */
  onBack?: () => void;
  onConfirm: (value: AdjustedRepaymentValue) => void;
};

const DEFAULT_RATE_PERCENT = 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculateRepaymentAmount(unsecuredDebtManwon: number, ratePercent: number) {
  return Math.round((unsecuredDebtManwon * clamp(ratePercent, 0, 100)) / 100);
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M15.9 6.67A6.67 6.67 0 1 0 16.48 12M15.9 6.67V2.5m0 4.17h-4.17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoubleChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5.5 4.5 10.5 10 5.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 4.5 15.5 10 10.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatManwon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}만원`;
}

function buildRangeStyle(value: number, min: number, max: number): CSSProperties {
  const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return { "--adjusted-repayment-progress": `${percentage}%` } as CSSProperties;
}

const RANGE_CLASS_NAME =
  "adjusted-repayment-range h-4 w-full cursor-pointer appearance-none bg-transparent outline-none";

export default function AnalysisAdjustedRepaymentModal({
  open,
  procedure,
  unsecuredDebtManwon,
  disposableIncomeManwon,
  initialValue,
  adjustmentApplied,
  submitting = false,
  onClose,
  onReset,
  onSkip,
  onBack,
  onConfirm,
}: Props) {
  const range = procedure ? ANALYSIS_ADJUSTED_REPAYMENT_PERIOD_RANGE[procedure] : null;
  const minYears = range ? range.minMonths / 12 : 1;
  const maxYears = range ? range.maxMonths / 12 : 1;
  const initialMonthlyPayment = initialValue?.monthlyPayment;
  const initialPeriodMonths = initialValue?.periodMonths;

  const [repaymentAmountManwon, setRepaymentAmountManwon] = useState(0);
  const [periodYears, setPeriodYears] = useState(maxYears);

  useEffect(() => {
    if (!open || !range) return;
    if (initialMonthlyPayment != null && initialPeriodMonths != null && unsecuredDebtManwon > 0) {
      const repaymentAmount = Math.round(initialMonthlyPayment * initialPeriodMonths);
      setRepaymentAmountManwon(clamp(repaymentAmount, 0, unsecuredDebtManwon));
      setPeriodYears(Math.min(range.maxMonths, Math.max(range.minMonths, initialPeriodMonths)) / 12);
      return;
    }
    setRepaymentAmountManwon(calculateRepaymentAmount(unsecuredDebtManwon, DEFAULT_RATE_PERCENT));
    setPeriodYears(range.maxMonths / 12);
  }, [initialMonthlyPayment, initialPeriodMonths, open, range, unsecuredDebtManwon]);

  const derived = useMemo(() => {
    if (!range) return null;
    const ratePercent = unsecuredDebtManwon > 0 ? (repaymentAmountManwon / unsecuredDebtManwon) * 100 : 0;
    const exemptAmountManwon = Math.max(0, unsecuredDebtManwon - repaymentAmountManwon);
    const periodMonths = periodYears * 12;
    // 이 값은 화면 표시(formatManwon이 정수로 반올림)뿐 아니라 onConfirm으로 서버에 그대로
    // 전송된다. 여기서 미리 반올림해 보내면, 재진입 시 initialValue(monthlyPayment*periodMonths)로
    // repaymentAmountManwon을 역산할 때 손실이 누적돼 방금 입력한 금액과 달라져 "값이 튕기는"
    // 것처럼 보인다(예: 5,000만원 입력 → 저장 → 재진입 시 4,998만원). 반올림 없이 그대로 두면
    // Math.round(monthlyPayment * periodMonths)가 원래 정수 금액을 정확히 복원한다.
    const monthlyPaymentManwon = periodMonths > 0 ? repaymentAmountManwon / periodMonths : 0;
    const monthlyPaymentAtMinPeriod = Math.round((repaymentAmountManwon / range.minMonths) * 10) / 10;
    const monthlyPaymentAtMaxPeriod = Math.round((repaymentAmountManwon / range.maxMonths) * 10) / 10;
    const excessIncomeManwon = Math.max(0, monthlyPaymentManwon - disposableIncomeManwon);
    return {
      repaymentAmountManwon,
      ratePercent,
      exemptAmountManwon,
      periodMonths,
      monthlyPaymentManwon,
      monthlyPaymentAtMinPeriod,
      monthlyPaymentAtMaxPeriod,
      excessIncomeManwon,
    };
  }, [range, unsecuredDebtManwon, repaymentAmountManwon, periodYears, disposableIncomeManwon]);

  if (!open || !procedure || !range || !derived) return null;

  const yearTicks = Array.from({ length: maxYears - minYears + 1 }, (_, index) => minYears + index);
  const hasSavedAdjustment = adjustmentApplied ?? (initialValue != null);

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="w-[calc(100vw-2rem)] max-w-[440px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[14px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.366)] drop-shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
      ariaLabel="변제 계획 조정"
      disableAutoContainerSizing
      closeOnOverlayClick={!submitting}
    >
      <div className="relative px-7 pb-[26px] pt-6">
        <h2 className="text-[18px] font-semibold leading-[21px] text-foreground">변제 계획 조정</h2>
        <p className="mt-1 text-[13px] font-medium leading-4 text-neutral-60">
          {RECOMMENDED_PROCEDURE_LABEL[procedure]} · {formatManwon(unsecuredDebtManwon)} (무담보 채무 기준)
        </p>
        <div className="absolute right-7 top-5 flex items-center gap-2">
          {hasSavedAdjustment && onReset ? (
            <button
              type="button"
              onClick={onReset}
              disabled={submitting}
              className="flex h-[34px] cursor-pointer items-center gap-1 rounded-[5px] px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-60 hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon />
              되돌리기
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="닫기"
            className="grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70 disabled:cursor-not-allowed"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="relative mx-7 h-[317px] rounded-[12px] bg-neutral-10 px-6 py-5">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[14px] font-medium leading-[17px] text-neutral-60">변제</span>
              <label className="mt-3 flex w-fit items-center border-b border-dashed border-neutral-40 font-montserrat text-[20px] font-bold leading-7 tracking-[-0.03em] text-neutral-90">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="변제금액"
                  value={derived.repaymentAmountManwon.toLocaleString("ko-KR")}
                  disabled={submitting}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    setRepaymentAmountManwon(clamp(Number(digits || 0), 0, unsecuredDebtManwon));
                  }}
                  className="w-[82px] bg-transparent text-left outline-none"
                />
                <span>만원</span>
              </label>
              <label className="mt-1 flex w-fit items-center border-b border-dashed border-neutral-40 text-[14px] font-medium leading-[17px] text-neutral-60">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.1}
                  aria-label="변제율 입력"
                  value={Number(derived.ratePercent.toFixed(1))}
                  disabled={submitting}
                  onChange={(event) => {
                    const nextRatePercent = Number(event.target.value);
                    if (Number.isNaN(nextRatePercent)) return;
                    setRepaymentAmountManwon(calculateRepaymentAmount(unsecuredDebtManwon, nextRatePercent));
                  }}
                  className="w-[36px] bg-transparent text-left outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span>%</span>
              </label>
            </div>
            <div className="text-right">
              <span className="block text-[14px] font-medium leading-[17px] text-neutral-60">면책</span>
              <span className="mt-3 block font-montserrat text-[20px] font-bold leading-7 tracking-[-0.03em] text-neutral-90">
                {formatManwon(derived.exemptAmountManwon)}
              </span>
              <span className="mt-1 block text-[14px] font-medium leading-[17px] text-neutral-60">
                {(100 - derived.ratePercent).toFixed(1)}%
              </span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={derived.ratePercent}
            disabled={submitting}
            onChange={(event) => {
              setRepaymentAmountManwon(calculateRepaymentAmount(unsecuredDebtManwon, Number(event.target.value)));
            }}
            className={`mt-0.5 ${RANGE_CLASS_NAME}`}
            style={buildRangeStyle(derived.ratePercent, 0, 100)}
            aria-label="변제율"
          />
        </div>

        <div className="my-4 h-px bg-neutral-30" aria-hidden />

        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[14px] font-medium leading-[17px] text-neutral-60">월 변제액</span>
              <span className="mt-3 block font-montserrat text-[20px] font-bold leading-7 tracking-[-0.03em] text-danger-60">
                {formatManwon(derived.monthlyPaymentManwon)}
              </span>
              <span className="mt-1 block text-[12px] font-medium leading-[14px] text-neutral-60">
                월 {derived.monthlyPaymentAtMinPeriod.toLocaleString("ko-KR")}만
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[14px] font-medium leading-[17px] text-neutral-60">기간</span>
              <span className="mt-3 block font-montserrat text-[20px] font-bold leading-7 tracking-[-0.03em] text-neutral-90">
                {periodYears}년
              </span>
              <span className="mt-1 block text-[12px] font-medium leading-[14px] text-neutral-60">
                월 {derived.monthlyPaymentAtMaxPeriod.toLocaleString("ko-KR")}만
              </span>
            </div>
          </div>
          <input
            type="range"
            min={minYears}
            max={maxYears}
            step={1}
            value={periodYears}
            disabled={submitting}
            onChange={(event) => setPeriodYears(Number(event.target.value))}
            className={`mt-[9px] ${RANGE_CLASS_NAME}`}
            style={buildRangeStyle(periodYears, minYears, maxYears)}
            aria-label="변제 기간(년)"
          />
          <div className="mt-1 flex justify-between px-2 text-[10px] font-medium leading-3 text-neutral-60">
            {yearTicks.map((year) => <span key={year} className="inline-flex w-0 justify-center">{year}</span>)}
          </div>
        </div>

        <p
          aria-hidden={derived.excessIncomeManwon <= 0}
          className={`absolute bottom-3 left-6 text-[14px] font-semibold leading-[17px] tracking-[0.2px] text-danger-60 ${
            derived.excessIncomeManwon > 0 ? "visible" : "invisible"
          }`}
        >
          가용소득 {derived.excessIncomeManwon.toLocaleString("ko-KR")}만원 초과
        </p>
      </div>

      <div className={`mt-[30px] flex h-[60px] items-center border-t border-neutral-30 px-6 ${onSkip ? "justify-between" : "justify-end"}`}>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-semibold text-neutral-60 hover:text-neutral-70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DoubleChevronRightIcon />
            건너뛰기
          </button>
        ) : null}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack ?? onClose}
            disabled={submitting}
            className="h-[34px] cursor-pointer rounded-[5px] border border-neutral-30 px-3 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {onBack ? "이전" : "취소"}
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ monthlyPayment: derived.monthlyPaymentManwon, periodMonths: derived.periodMonths })}
            disabled={submitting}
            className="h-[34px] cursor-pointer rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
