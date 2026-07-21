"use client";

import { useEffect } from "react";
import type {
  AnalysisDebtBreakdown,
  AnalysisFinancialAssetRange,
  AnalysisInputData,
  AnalysisMonthlyIncomeRange,
  AnalysisOverduePeriod,
  AnalysisRealEstateBreakdown,
  AnalysisVehicleValueRange,
} from "@/types/analysis";
import {
  CREDITOR_COUNT_OPTIONS,
  DEBT_CAUSE_OPTIONS,
  DEBT_TYPE_OPTIONS,
  FINANCIAL_ASSET_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  MONTHLY_INCOME_OPTIONS,
  OVERDUE_PERIOD_OPTIONS,
  REAL_ESTATE_OPTIONS,
  VEHICLE_OPTIONS,
  type CreditorCountRange,
  type DebtCause,
  type DebtType,
  type FinancialAssetRange,
  type MonthlyIncomeRange,
  type OverduePeriod,
  type RealEstateType,
  type VehicleRange,
} from "@/types/debtRelief";
import { formatContactForDisplay } from "@/utils/format";

type Props = {
  open: boolean;
  onClose: () => void;
  inputData: AnalysisInputData;
  contact: string | null;
};

type DisplayRow = { label: string; value: string; emphasize?: boolean };

const FINANCIAL_ASSET_FROM: Record<AnalysisFinancialAssetRange, FinancialAssetRange> = {
  none: "none",
  under_500: "under_500",
  "500_to_2000": "500_2000",
  "2000_to_5000": "2000_5000",
  over_5000: "over_5000",
};

const VEHICLE_FROM: Record<AnalysisVehicleValueRange, VehicleRange> = {
  none: "none",
  under_500: "under_500",
  "500_to_2000": "500_2000",
  over_2000: "over_2000",
};

const OVERDUE_FROM: Record<AnalysisOverduePeriod, OverduePeriod> = {
  none: "none",
  under_3_months: "under_3m",
  "3_to_6_months": "3_6m",
  "6_to_12_months": "6_12m",
  over_1_year: "over_1y",
};

const INCOME_FROM: Record<AnalysisMonthlyIncomeRange, MonthlyIncomeRange> = {
  under_100: "under_100",
  "100_to_200": "100_200",
  "200_to_300": "200_300",
  "300_to_400": "300_400",
  over_400: "over_400",
};

const DEBT_CAUSE_FROM: Record<string, DebtCause> = {
  business_failure: "business_failure",
  living_expenses: "living_expenses",
  medical_expenses: "medical",
  investment_loss: "investment_loss",
  guarantee_damage: "guarantee_damage",
  other: "other",
};

const BREAKDOWN_TO_DEBT: Record<keyof AnalysisDebtBreakdown, DebtType> = {
  bankLoan: "bank_loan",
  cardDebt: "card_loan",
  capitalLoan: "capital",
  privateDebt: "private_loan",
  personalBorrowing: "personal_borrowing",
};

const BREAKDOWN_TO_REAL_ESTATE: Record<keyof AnalysisRealEstateBreakdown, RealEstateType> = {
  ownedValue: "owned",
  jeonseDeposit: "jeonse_deposit",
  rentalValue: "rental_income",
};

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: string | null | undefined
): string {
  if (!value) return "-";
  const byValue = options.find((o) => o.value === value);
  if (byValue) return byValue.label;
  const byLabel = options.find((o) => o.label === value);
  if (byLabel) return byLabel.label;
  return value;
}

function yesNo(value: boolean | null | undefined): string {
  if (value == null) return "-";
  return value ? "있음" : "없음";
}

function formatManwon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value.toLocaleString("ko-KR")}만원`;
}

function formatSignedManwon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toLocaleString("ko-KR")}만원`;
}

function formatDependents(count: number | null | undefined): string {
  if (count == null) return "-";
  if (count <= 0) return "없음";
  if (count >= 4) return "4명 이상";
  return `${count}명`;
}

function creditorCountLabel(count: number | null | undefined): string {
  if (count == null) return "-";
  let range: CreditorCountRange;
  if (count <= 2) range = "1_2";
  else if (count <= 5) range = "3_5";
  else if (count <= 10) range = "6_10";
  else range = "over_10";
  return CREDITOR_COUNT_OPTIONS.find((o) => o.value === range)?.label ?? `${count}곳`;
}

function realEstateOwnershipLabel(breakdown: AnalysisRealEstateBreakdown): string {
  const owned = (Object.keys(breakdown) as (keyof AnalysisRealEstateBreakdown)[]).filter(
    (key) => (breakdown[key] ?? 0) > 0
  );
  if (owned.length === 0) return "없음";
  return owned
    .map((key) => {
      const type = BREAKDOWN_TO_REAL_ESTATE[key];
      return REAL_ESTATE_OPTIONS.find((o) => o.value === type)?.label ?? key;
    })
    .join(", ");
}

function debtTypesLabel(breakdown: AnalysisDebtBreakdown): string {
  const types = (Object.keys(breakdown) as (keyof AnalysisDebtBreakdown)[])
    .filter((key) => (breakdown[key] ?? 0) > 0)
    .map((key) => {
      const type = BREAKDOWN_TO_DEBT[key];
      return DEBT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? key;
    });
  return types.length > 0 ? types.join(", ") : "-";
}

function debtCausesLabel(causes: string[]): string {
  if (!causes.length) return "-";
  return causes
    .map((cause) => {
      const mapped = DEBT_CAUSE_FROM[cause];
      return mapped
        ? DEBT_CAUSE_OPTIONS.find((o) => o.value === mapped)?.label ?? cause
        : cause;
    })
    .join(", ");
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 19L8 12L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoRows({ rows }: { rows: DisplayRow[] }) {
  return (
    <dl className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start gap-3 min-w-0">
          <dt className="w-[108px] shrink-0 text-[13px] text-neutral-60 leading-5">{row.label}</dt>
          <dd
            className={`min-w-0 flex-1 text-[13px] leading-5 break-words whitespace-pre-line ${
              row.emphasize ? "font-semibold text-foreground" : "font-medium text-foreground"
            }`}
          >
            {row.value || "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function InfoSection({
  title,
  rows,
  className = "",
  columns,
}: {
  title: string;
  rows: DisplayRow[];
  className?: string;
  /** PC에서 소득/지출 내부 2열용 */
  columns?: { left: DisplayRow[]; right: DisplayRow[] };
}) {
  return (
    <section
      className={`rounded-[12px] border border-neutral-30 bg-card overflow-hidden flex flex-col min-h-0 ${className}`}
    >
      <h3 className="px-4 py-2.5 text-[14px] font-semibold text-foreground border-b border-neutral-30 shrink-0">
        {title}
      </h3>
      <div className="px-4 py-3 flex-1">
        {columns ? (
          <>
            {/* PC: 내부 2열 / 태블릿·모바일: 1열(rows 순서) */}
            <div className="hidden min-[1201px]:grid min-[1201px]:grid-cols-2 gap-x-8">
              <InfoRows rows={columns.left} />
              <InfoRows rows={columns.right} />
            </div>
            <div className="min-[1201px]:hidden">
              <InfoRows rows={rows} />
            </div>
          </>
        ) : (
          <InfoRows rows={rows} />
        )}
      </div>
    </section>
  );
}

function buildSections(input: AnalysisInputData, contact: string | null | undefined) {
  const phone = contact ? formatContactForDisplay(contact) : "-";
  const bank = input.debtBreakdown.bankLoan ?? 0;
  const card = input.debtBreakdown.cardDebt ?? 0;
  const capital = input.debtBreakdown.capitalLoan ?? 0;

  const customerRows: DisplayRow[] = [
    { label: "고객명", value: input.customerName || "-" },
    { label: "성별", value: input.gender === "female" ? "여" : input.gender === "male" ? "남" : "-" },
    { label: "연령대", value: input.ageGroup || "-" },
    { label: "휴대폰번호", value: phone },
    { label: "고용형태", value: input.employmentType || "-" },
    { label: "부양가족", value: formatDependents(input.dependents) },
    { label: "배우자 소득", value: yesNo(input.hasSpouseIncome) },
  ];

  const assetRows: DisplayRow[] = [
    { label: "부동산 보유여부", value: realEstateOwnershipLabel(input.realEstateBreakdown) },
    {
      label: "금융자산",
      value: optionLabel(
        FINANCIAL_ASSET_OPTIONS,
        FINANCIAL_ASSET_FROM[input.financialAssetRange] ?? input.financialAssetRange
      ),
    },
    {
      label: "차량 보유",
      value: optionLabel(
        VEHICLE_OPTIONS,
        VEHICLE_FROM[input.vehicleValueRange] ?? input.vehicleValueRange
      ),
    },
    { label: "재산처분이력", value: yesNo(input.hasRecentAssetDisposal) },
  ];

  const debtRows: DisplayRow[] = [
    { label: "채무종류", value: debtTypesLabel(input.debtBreakdown) },
    { label: "은행대출", value: formatManwon(bank) },
    { label: "카드론", value: formatManwon(card) },
    { label: "캐피탈/저축은행", value: formatManwon(capital) },
    { label: "총 채무합계", value: formatManwon(input.totalDebt), emphasize: true },
    { label: "채권자 수", value: creditorCountLabel(input.creditorCount) },
    {
      label: "연체기간",
      value: optionLabel(
        OVERDUE_PERIOD_OPTIONS,
        OVERDUE_FROM[input.overduePeriod] ?? input.overduePeriod
      ),
    },
    { label: "체납이력", value: yesNo(input.hasTaxArrears) },
    { label: "채무발생원인", value: debtCausesLabel(input.debtCauses ?? []) },
  ];

  const incomeLeftRows: DisplayRow[] = [
    {
      label: "월 소득 (세후)",
      value: optionLabel(
        MONTHLY_INCOME_OPTIONS,
        INCOME_FROM[input.monthlyIncomeRange] ?? input.monthlyIncomeRange
      ),
    },
    {
      label: "주거형태",
      value: optionLabel(HOUSING_TYPE_OPTIONS, input.housingType),
    },
    { label: "주거비", value: formatManwon(input.fixedExpenses.housingCost) },
    { label: "식비", value: formatManwon(input.fixedExpenses.foodCost) },
    {
      label: "월 가용소득",
      value: formatSignedManwon(input.disposableIncome),
      emphasize: true,
    },
  ];

  const incomeRightRows: DisplayRow[] = [
    { label: "교육비", value: formatManwon(input.fixedExpenses.educationCost) },
    { label: "교통비", value: formatManwon(input.fixedExpenses.transportCost) },
    { label: "기타 고정지출", value: formatManwon(input.fixedExpenses.otherFixedCost) },
    {
      label: "총 지출",
      value: formatSignedManwon(-(input.totalMonthlyExpense ?? 0)),
      emphasize: true,
    },
  ];

  // 1열(모바일·태블릿)에서는 지출 항목을 가용소득 앞에 모아 자연스럽게 읽히도록 함
  const incomeRows: DisplayRow[] = [
    ...incomeLeftRows.slice(0, 4),
    ...incomeRightRows,
    incomeLeftRows[4],
  ];

  const otherRows: DisplayRow[] = [
    {
      label: "개인회생/파산이력",
      value: input.hasPreviousBankruptcy
        ? input.previousBankruptcyNote?.trim()
          ? `있음\n${input.previousBankruptcyNote.trim()}`
          : "있음"
        : "없음",
    },
    {
      label: "보증인 연대보증",
      value: input.hasGuarantorRelation
        ? input.guarantorNote?.trim()
          ? `있음\n${input.guarantorNote.trim()}`
          : "있음"
        : "없음",
    },
    {
      label: "현재 소송 / 압류",
      value: input.hasActiveLawsuit
        ? input.lawsuitNote?.trim()
          ? `있음\n${input.lawsuitNote.trim()}`
          : "있음"
        : "없음",
    },
    { label: "특이사항", value: input.additionalNotes?.trim() || "-" },
  ];

  return {
    customerRows,
    assetRows,
    debtRows,
    incomeRows,
    incomeLeftRows,
    incomeRightRows,
    otherRows,
  };
}

/**
 * 진단 상세 「고객정보」 모달.
 * 상세 페이지 진입 시 이미 조회된 inputData + contact를 그대로 사용합니다.
 * (별도 API 재조회 없음 — /v1/customers 도 호출하지 않습니다.)
 */
export default function DiagnosisCustomerInfoModal({
  open,
  onClose,
  inputData,
  contact,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const summaryLabel = [inputData.customerName, inputData.ageGroup, inputData.employmentType]
    .filter(Boolean)
    .join(" · ");
  const sections = buildSections(inputData, contact);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnosis-customer-info-title"
        className={[
          "fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col overflow-hidden",
          "w-[calc(100%-2rem)] max-h-[90vh]",
          "bg-card dark:bg-neutral-10 rounded-[14px]",
          // 태블릿 709~1200 / PC 1201+
          "min-[709px]:left-1/2 min-[709px]:right-auto min-[709px]:-translate-x-1/2",
          "min-[709px]:max-[1200px]:w-[708px]",
          "min-[1201px]:w-[1046px]",
        ].join(" ")}
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-5 pt-5 pb-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="뒤로가기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70 shrink-0"
          >
            <BackIcon />
          </button>
          <h2
            id="diagnosis-customer-info-title"
            className="text-[18px] font-semibold text-foreground shrink-0"
          >
            고객정보
          </h2>
          {summaryLabel ? (
            <>
              <span className="w-px h-4 bg-neutral-40 shrink-0" aria-hidden />
              <p className="flex-1 min-w-0 text-[14px] font-medium text-neutral-60 truncate">
                {summaryLabel}
              </p>
            </>
          ) : (
            <span className="flex-1" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70 shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
          <div
            className={[
              "grid gap-6",
              "grid-cols-1",
              // 태블릿: 2열 — 고객|자산 / 채무|기타 / 소득|빈칸
              "min-[709px]:max-[1200px]:grid-cols-2",
              // PC: 3열 — 상단 고객|자산|채무 / 하단 소득(2) | 기타
              "min-[1201px]:grid-cols-3",
            ].join(" ")}
          >
            <InfoSection
              title="고객 정보"
              rows={sections.customerRows}
              className="order-1"
            />
            <InfoSection
              title="자산현황"
              rows={sections.assetRows}
              className="order-2"
            />
            <InfoSection
              title="채무현황"
              rows={sections.debtRows}
              className="order-3"
            />
            {/*
              모바일·PC: 소득 → 기타
              태블릿: 기타 → 소득 (order로 전환)
            */}
            <InfoSection
              title="소득/지출"
              rows={sections.incomeRows}
              columns={{
                left: sections.incomeLeftRows,
                right: sections.incomeRightRows,
              }}
              className="order-4 min-[709px]:max-[1200px]:order-5 min-[1201px]:order-4 min-[1201px]:col-span-2"
            />
            <InfoSection
              title="기타사항"
              rows={sections.otherRows}
              className="order-5 min-[709px]:max-[1200px]:order-4 min-[1201px]:order-5"
            />
          </div>
        </div>

        <div className="border-t border-neutral-30 px-5 py-4 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold hover:opacity-90"
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}
