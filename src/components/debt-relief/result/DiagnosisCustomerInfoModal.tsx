"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  AnalysisDebtBreakdown,
  AnalysisFreshStartFundInsolvencyReason,
  AnalysisInputData,
} from "@/types/analysis";
import {
  BUSINESS_OPERATION_STATUS_OPTIONS,
  ASSET_CATEGORY_OPTIONS,
  DEBT_CAUSE_LABELS,
  DEBT_TYPE_OPTIONS,
  FRESH_START_FUND_INSOLVENCY_REASON_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  resolveCourtMinimumLivingCostWon,
  type DebtCause,
  type DebtType,
  type DiagnosisDetail,
} from "@/types/debtRelief";
import { wonToManwon } from "@/services/debtRelief";
import DebtDetailModal from "./DebtDetailModal";

type Props = {
  open: boolean;
  onClose: () => void;
  detail: DiagnosisDetail;
  projectId: string | null;
  /** 「자세히 보기」로 연 채무 상세 모달에서 값 저장/재분석에 성공했을 때 상위 상세 데이터 새로고침 */
  onDebtApplied: () => void | Promise<void>;
};

export type DisplayRow = { label: string; value: string; emphasize?: boolean };

const DEBT_CAUSE_FROM: Record<string, DebtCause> = {
  business_failure: "business_failure",
  living_expenses: "living_expenses",
  medical_expenses: "medical",
  investment_loss: "investment_loss",
  gambling_or_speculative_investment_loss: "gambling_or_speculative_investment_loss",
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

/** 법정 생계비처럼 월소득에서 차감되는 항목 표시용 — Figma가 "-" 부호를 붙여 보여준다. */
function formatDeductedManwon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `-${value.toLocaleString("ko-KR")}만원`;
}

function formatDependents(count: number | null | undefined): string {
  if (count == null) return "-";
  if (count <= 0) return "없음";
  if (count >= 4) return "4명 이상";
  return `${count}명`;
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

// 선택 UI(DEBT_CAUSE_OPTIONS)에는 없는 레거시 값(investment_loss)도 읽기 전용 표시는 계속 필요해
// DEBT_CAUSE_OPTIONS가 아니라 전체 라벨을 담은 DEBT_CAUSE_LABELS에서 찾는다.
function debtCausesLabel(causes: string[]): string {
  if (!causes.length) return "-";
  return causes
    .map((cause) => {
      const mapped = DEBT_CAUSE_FROM[cause];
      return mapped ? DEBT_CAUSE_LABELS[mapped] : cause;
    })
    .join(", ");
}

function freshStartFundInsolvencyReasonsLabel(
  reasons: AnalysisFreshStartFundInsolvencyReason[] | null | undefined
): string {
  if (!reasons || reasons.length === 0) return "-";
  return reasons
    .map((reason) => FRESH_START_FUND_INSOLVENCY_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason)
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

// "자세히 보기" 버튼의 돋보기 아이콘 — SectionDebtStatus.tsx의 동일 버튼과 통일.
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
  titleAction,
}: {
  title: string;
  rows: DisplayRow[];
  className?: string;
  /** 태블릿·PC에서 내부 2열로 나눠 보여줄 항목 (행이 많은 섹션용) */
  columns?: { left: DisplayRow[]; right: DisplayRow[] };
  /** 타이틀 옆에 붙는 버튼 등 — 채무현황의 「자세히 보기」 */
  titleAction?: ReactNode;
}) {
  return (
    <section
      className={`rounded-[12px] border border-neutral-30 bg-card overflow-hidden flex flex-col min-h-0 ${className}`}
    >
      <h3 className="px-4 py-2.5 flex items-center gap-2 text-[14px] font-semibold text-foreground border-b border-neutral-30 shrink-0">
        {title}
        {titleAction}
      </h3>
      <div className="px-4 py-3 flex-1">
        {columns ? (
          <>
            {/* 모바일: 1열(rows 순서) / 태블릿·PC: 내부 2열 */}
            <div className="hidden min-[709px]:grid min-[709px]:grid-cols-2 gap-x-8">
              <InfoRows rows={columns.left} />
              <InfoRows rows={columns.right} />
            </div>
            <div className="min-[709px]:hidden">
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

// 2026-08-08 디자인 개편: 휴대폰번호·부양가족/배우자소득(→소득/지출로 이동)·자가 소유 시가는
// 새 시안(태블릿·PC 모두 확인)에 더 이상 없어 뺐다 — 휴대폰번호를 이 모달에 표시하지 않게 되면서
// buildSections도 contact 인자 없이 inputData만으로 계산한다.
// AnalysisPrintDocument(인쇄 전용 레이아웃)도 동일한 5개 그룹·계산식을 재사용한다 —
// 특히 법원 인정 최저생계비·레거시 소득 데이터 판정은 이 모달이 유일한 소스라 중복 구현하면
// 인쇄물과 화면이 어긋날 수 있다.
export function buildSections(input: AnalysisInputData) {
  // 응답 타입은 assets/debts/debtBreakdown을 필수로 선언하지만, 이 필드들이 추가되기 전에
  // 생성된 레거시 건은 백엔드가 실제로 값을 내려주지 않는다(위 monthlyIncome류와 같은 부류의
  // "조용한 스펙 변경" — 타입만 보고 항상 배열이라 가정하면 그 건들에서 크래시난다).
  const assets = input.assets ?? [];
  const debts = input.debts ?? [];
  const debtBreakdown = input.debtBreakdown ?? {};

  const bank = debtBreakdown.bankLoan ?? 0;
  const card = debtBreakdown.cardDebt ?? 0;
  const capital = debtBreakdown.capitalLoan ?? 0;

  const customerRows: DisplayRow[] = [
    { label: "고객명", value: input.customerName || "-" },
    { label: "성별", value: input.gender === "female" ? "여" : input.gender === "male" ? "남" : "-" },
    { label: "연령대", value: input.ageGroup || "-" },
    { label: "거주지역", value: input.region || "-" },
  ];

  const assetRows: DisplayRow[] = [
    { label: "보유 자산", value: assets.length ? assets.map((asset) => `${optionLabel(ASSET_CATEGORY_OPTIONS, asset.category)} ${formatManwon(asset.marketValue)}`).join(", ") : "없음" },
    { label: "자산 시가 합계", value: formatManwon(assets.reduce((sum, asset) => sum + asset.marketValue, 0)) },
    { label: "재산처분이력", value: yesNo(input.hasRecentAssetDisposal) },
  ];

  const debtLeftRows: DisplayRow[] = [
    { label: "채무종류", value: debtTypesLabel(debtBreakdown) },
    { label: "은행대출", value: formatManwon(bank) },
    { label: "카드론", value: formatManwon(card) },
    { label: "캐피탈/저축은행", value: formatManwon(capital) },
    { label: "총 채무합계", value: formatManwon(input.totalDebt), emphasize: true },
  ];

  const collateralDebtManwon = wonToManwon(debts.filter((debt) => debt.collateralAssetId).reduce((sum, debt) => sum + debt.currentBalanceWon, 0));
  const debtRightRows: DisplayRow[] = [
    { label: "채무 건수", value: `${debts.length}건` },
    { label: "담보부채무", value: formatManwon(collateralDebtManwon) },
    { label: "연체기간", value: `${input.overdueMonths ?? 0}개월` },
    { label: "채무발생원인", value: debtCausesLabel(input.debtCauses ?? []) },
  ];

  const debtRows: DisplayRow[] = [...debtLeftRows, ...debtRightRows];

  // 법원 인정 최저생계비 — 가구원수(부양가족수+1, 최소1 최대6) 기준. disposableIncome이 이 값과
  // additionalFixedExpense를 월소득에서 뺀 값이라(2026-08-07 스펙) 여기서도 동일 공식으로 표시한다.
  // ⚠️ DB 마이그레이션 비용 문제로 백필되지 않은 레거시 건(monthlyIncome이 응답에 아예 없음)은
  // disposableIncome이 옛 공식("월소득 − 실제 지출 합계")으로 계산돼 있어, 여기서 새 공식으로
  // 최저생계비를 계산해 보여주면 옆의 월 가용소득과 앞뒤가 안 맞는 숫자가 나란히 표시된다 —
  // 차라리 "-"로 비워 잘못된 확신을 주지 않는다(types/analysis.ts AnalysisInputData 주석 참고).
  const isLegacyIncomeData = input.monthlyIncome == null;
  const minimumLivingCostManwon = isLegacyIncomeData
    ? null
    : wonToManwon(resolveCourtMinimumLivingCostWon((input.dependents ?? 0) + 1));

  // 좌: 폼 입력값 그대로(고용형태~배우자소득) / 우: 월 가용소득 계산 breakdown — Step4IncomeExpense
  // 폼의 "입력 필드"와 "월 가용 소득" 계산 박스, 두 블록을 그대로 옮겨온 구성.
  const incomeLeftRows: DisplayRow[] = [
    { label: "고용형태", value: input.employmentType || "-" },
    { label: "월 소득 (세후)", value: formatManwon(input.monthlyIncome) },
    { label: "주거형태", value: optionLabel(HOUSING_TYPE_OPTIONS, input.housingType) },
    { label: "부양가족", value: formatDependents(input.dependents) },
    { label: "배우자 소득", value: yesNo(input.hasSpouseIncome) },
  ];

  const incomeRightRows: DisplayRow[] = [
    { label: "월 소득", value: formatManwon(input.monthlyIncome) },
    { label: "법정 생계비", value: isLegacyIncomeData ? "-" : formatDeductedManwon(minimumLivingCostManwon) },
    {
      label: "추가 필수지출",
      value: isLegacyIncomeData ? "-" : formatManwon(input.additionalFixedExpense),
    },
    {
      label: "월 가용소득",
      value: formatManwon(input.disposableIncome),
      emphasize: true,
    },
  ];

  const incomeRows: DisplayRow[] = [...incomeLeftRows, ...incomeRightRows];

  // 좌: 새출발기금(사업 영위 여부가 true일 때만 상세 4종이 실제로 채워짐) / 우: 소송·채무조정 이력
  const otherLeftRows: DisplayRow[] = [
    { label: "새출발기금", value: yesNo(input.isOperatingBusiness) },
    { label: "현재 사업 상태", value: optionLabel(BUSINESS_OPERATION_STATUS_OPTIONS, input.businessOperationStatus) },
    {
      label: "부실·부실우려 여부",
      value: freshStartFundInsolvencyReasonsLabel(input.freshStartFundInsolvencyReasons),
    },
    { label: "제외 업종 포함", value: yesNo(input.isExcludedIndustryForFreshStartFund) },
    { label: "이전신청 이력 있음", value: yesNo(input.hasPreviousFreshStartFundApplication) },
  ];

  const otherRightRows: DisplayRow[] = [
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

  const otherRows: DisplayRow[] = [...otherLeftRows, ...otherRightRows];

  return {
    customerRows,
    assetRows,
    debtRows,
    debtLeftRows,
    debtRightRows,
    incomeRows,
    incomeLeftRows,
    incomeRightRows,
    otherRows,
    otherLeftRows,
    otherRightRows,
  };
}

/**
 * 진단 상세 「고객정보」 모달.
 * 상세 페이지 진입 시 이미 조회된 detail(inputData/contact 포함)을 그대로 사용합니다.
 * (별도 API 재조회 없음 — /v1/customers 도 호출하지 않습니다.)
 */
export default function DiagnosisCustomerInfoModal({
  open,
  onClose,
  detail,
  projectId,
  onDebtApplied,
}: Props) {
  const [debtDetailOpen, setDebtDetailOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const inputData = detail.inputData;
  const summaryLabel = [inputData.customerName, inputData.ageGroup, inputData.employmentType]
    .filter(Boolean)
    .join(" · ");
  const sections = buildSections(inputData);

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
              // 태블릿: 2열 — 고객정보|자산현황이 한 행을 채우고, 채무현황·소득지출·기타사항은
              // 각각 2열을 모두 차지하며(항목이 많아 내부 2단 구성) 아래로 쌓인다.
              "min-[709px]:max-[1200px]:grid-cols-2",
              // PC: 4열 — 고객정보(1)+자산현황(1)+채무현황(2)이 한 행, 소득지출(2)+기타사항(2)이
              // 다음 행을 각각 정확히 채운다.
              "min-[1201px]:grid-cols-4",
            ].join(" ")}
          >
            <InfoSection title="고객 정보" rows={sections.customerRows} />
            <InfoSection title="자산현황" rows={sections.assetRows} />
            <InfoSection
              title="채무현황"
              rows={sections.debtRows}
              columns={{ left: sections.debtLeftRows, right: sections.debtRightRows }}
              className="min-[709px]:col-span-2"
              titleAction={
                <button
                  type="button"
                  onClick={() => setDebtDetailOpen(true)}
                  className="cursor-pointer inline-flex items-center gap-1 h-[24px] px-2 rounded-[5px] border border-secondary-20 dark:border-secondary-40 bg-white dark:bg-neutral-10 text-[12px] font-semibold leading-[15px] tracking-[-0.02em] text-foreground hover:bg-neutral-10 dark:hover:bg-neutral-20 whitespace-nowrap"
                >
                  <DebtDetailSearchIcon />
                  자세히 보기
                </button>
              }
            />
            <InfoSection
              title="소득/지출"
              rows={sections.incomeRows}
              columns={{ left: sections.incomeLeftRows, right: sections.incomeRightRows }}
              className="min-[709px]:col-span-2"
            />
            <InfoSection
              title="기타사항"
              rows={sections.otherRows}
              columns={{ left: sections.otherLeftRows, right: sections.otherRightRows }}
              className="min-[709px]:col-span-2"
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

      {projectId && (
        <DebtDetailModal
          open={debtDetailOpen}
          onClose={() => setDebtDetailOpen(false)}
          detail={detail}
          projectId={projectId}
          onApplied={onDebtApplied}
        />
      )}
    </>
  );
}
