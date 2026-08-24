"use client";

import { useState, type ReactNode } from "react";
import {
  isDebtCollateralLoan,
  type AnalysisCollateralBreakdown,
  type AnalysisDebtBreakdown,
  type AnalysisDebtItem,
  type AnalysisFreshStartFundInsolvencyReason,
  type AnalysisInputData,
} from "@/types/analysis";
import {
  BUSINESS_OPERATION_STATUS_OPTIONS,
  ASSET_CATEGORY_OPTIONS,
  DEBT_CAUSE_LABELS,
  DEBT_ITEM_TYPE_OPTIONS,
  DEBT_TYPE_OPTIONS,
  FRESH_START_FUND_INSOLVENCY_REASON_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  REPAYMENT_METHOD_OPTIONS,
  resolveCourtMinimumLivingCostWon,
  type DebtCause,
  type DebtType,
  type DiagnosisDetail,
} from "@/types/debtRelief";
import { wonToManwon } from "@/services/debtRelief";
import BaseModal from "@/components/common/BaseModal";
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

export type RichDisplayRow = {
  key: string;
  label: string;
  title: string;
  description?: string;
};

export type SummaryLine = {
  label: string;
  value?: string;
  emphasizeLabel?: boolean;
};

export type CustomerInfoViewModel = {
  customerRows: DisplayRow[];
  assetRows: RichDisplayRow[];
  incomeRows: DisplayRow[];
  debtRows: RichDisplayRow[];
  debtTotalRows: DisplayRow[];
  businessLines: SummaryLine[];
  otherCheckLines: SummaryLine[];
  counselorMemo: string;
};

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

function formatWon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatManwonAsWon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return formatWon(value * 10_000);
}

function formatDate(value: string | null | undefined): string {
  return value ? value.replaceAll("-", ".") : "-";
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

type ContentRow = {
  key: string;
  label: string;
  content: ReactNode;
};

function ContentRows({ rows }: { rows: ContentRow[] }) {
  return (
    <dl className="flex flex-col gap-3">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)] items-start gap-6"
        >
          <dt className="text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
            {row.label}
          </dt>
          <dd className="min-w-0 break-words text-[14px] font-medium leading-5 tracking-[-0.02em] text-foreground">
            {row.content}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function InfoRows({ rows }: { rows: DisplayRow[] }) {
  return (
    <ContentRows
      rows={rows.map((row, index) => ({
        key: `${row.label}-${index}`,
        label: row.label,
        content: (
          <span className={`whitespace-pre-line ${row.emphasize ? "font-bold" : ""}`}>
            {row.value || "-"}
          </span>
        ),
      }))}
    />
  );
}

function InfoSection({
  title,
  children,
  className = "",
  titleAction,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** 타이틀 옆에 붙는 버튼 등 — 채무현황의 「자세히 보기」 */
  titleAction?: ReactNode;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-[12px] border border-neutral-30 bg-neutral-10 dark:bg-neutral-0 ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4">
        <h3 className="text-[16px] font-bold leading-[19px] tracking-[0.2px] text-foreground">
          {title}
        </h3>
        {titleAction}
      </div>
      <div className="min-h-0 flex-1 px-5 pb-5 pt-3">
        {children}
      </div>
    </section>
  );
}

function RichInfoRows({ rows }: { rows: RichDisplayRow[] }) {
  return (
    <ContentRows
      rows={rows.map((row) => ({
        key: row.key,
        label: row.label,
        content: (
          <div>
            <p className="font-bold">{row.title}</p>
            {row.description ? (
              <p className="whitespace-pre-line font-normal text-neutral-80">{row.description}</p>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}

function buildDebtDescription(debt: AnalysisDebtItem): string {
  const details = [
    isDebtCollateralLoan(debt) ? "담보대출" : "무담보대출",
    optionLabel(DEBT_ITEM_TYPE_OPTIONS, debt.debtType),
    debt.creditorName?.trim() || null,
    debt.repaymentMethod
      ? `${optionLabel(REPAYMENT_METHOD_OPTIONS, debt.repaymentMethod)}상환`
      : null,
    debt.remainingMonths != null ? `상환기간 ${debt.remainingMonths}개월` : null,
    `연체 ${debt.overdueMonths ?? 0}개월`,
    debt.loanDate ? `대출일 ${formatDate(debt.loanDate)}` : null,
    debt.maturityDate ? `만기일 ${formatDate(debt.maturityDate)}` : null,
    `현재 잔액 ${formatWon(debt.currentBalanceWon)}`,
    debt.interestRate != null ? `금리 ${debt.interestRate}%` : null,
    debt.isExcludedFromAnalysis ? "분석 제외" : null,
  ].filter((value): value is string => Boolean(value));

  return details.join(", ");
}

function SummaryLines({
  lines,
}: {
  lines: SummaryLine[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, index) => (
        <p key={`${line.label}-${index}`}>
          <span className={line.emphasizeLabel === false ? "" : "font-bold"}>{line.label}</span>
          {line.value ? ` - ${line.value}` : ""}
        </p>
      ))}
    </div>
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

  const collateralDebtManwon = wonToManwon(debts.filter(isDebtCollateralLoan).reduce((sum, debt) => sum + debt.currentBalanceWon, 0));
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

  const incomeSummaryRows: DisplayRow[] = [
    { label: "월소득 (세후)", value: formatManwon(input.monthlyIncome) },
    { label: "주거형태", value: optionLabel(HOUSING_TYPE_OPTIONS, input.housingType) },
    {
      label: "법정 생계비",
      value: isLegacyIncomeData ? "-" : formatDeductedManwon(minimumLivingCostManwon),
    },
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
    incomeSummaryRows,
    otherRows,
    otherLeftRows,
    otherRightRows,
  };
}

/** 화면 모달과 인쇄 문서가 같은 최신 고객정보 구성과 계산값을 사용하도록 만드는 단일 뷰 모델. */
export function buildCustomerInfoViewModel(
  input: AnalysisInputData,
  collateralBreakdown?: AnalysisCollateralBreakdown
): CustomerInfoViewModel {
  const sections = buildSections(input);
  const assets = input.assets ?? [];
  const debts = input.debts ?? [];
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  const assetRows: RichDisplayRow[] = assets.length
    ? assets.map((asset, index) => {
        // 이 자산을 담보로 잡은 채무가 있으면 채무내역과 동일한 상세(은행/상환방식/기간/연체/
        // 대출일/만기일/잔액/금리)를 여기에도 노출한다 — 채무내역에만 있고 자산현황엔 없어서
        // 후자가 텅 비어 보이던 문제. 담보 채무가 없을 때만 자산 자체의 자유 메모로 대체한다.
        const securedDebts = debts.filter((debt) => debt.collateralAssetId === asset.id);
        const description = securedDebts.length
          ? securedDebts.map((debt) => buildDebtDescription(debt)).join("\n")
          : asset.description?.trim() || undefined;
        return {
          key: asset.id || `${asset.category}-${index}`,
          label: optionLabel(ASSET_CATEGORY_OPTIONS, asset.category),
          title: formatManwon(asset.marketValue),
          description,
        };
      })
    : [{ key: "no-assets", label: "보유 자산", title: "없음" }];

  let debtRows: RichDisplayRow[];
  if (debts.length > 0) {
    debtRows = debts.map((debt, index) => {
      const collateralAsset = debt.collateralAssetId
        ? assetById.get(debt.collateralAssetId)
        : undefined;
      return {
        key: debt.id || `debt-${index}`,
        label: index === 0 ? "채무내역" : "",
        title: collateralAsset
          ? `${optionLabel(ASSET_CATEGORY_OPTIONS, collateralAsset.category)} 담보`
          : optionLabel(DEBT_ITEM_TYPE_OPTIONS, debt.debtType),
        description: buildDebtDescription(debt),
      };
    });
  } else {
    debtRows = (Object.keys(input.debtBreakdown ?? {}) as (keyof AnalysisDebtBreakdown)[])
      .filter((key) => (input.debtBreakdown?.[key] ?? 0) > 0)
      .map((key, index) => {
        const debtType = BREAKDOWN_TO_DEBT[key];
        return {
          key,
          label: index === 0 ? "채무내역" : "",
          title: DEBT_TYPE_OPTIONS.find((option) => option.value === debtType)?.label ?? key,
          description: formatManwon(input.debtBreakdown[key]),
        };
      });
    if (debtRows.length === 0) {
      debtRows = [{ key: "no-debts", label: "채무내역", title: "없음" }];
    }
  }

  const includedDebts = debts.filter((debt) => !debt.isExcludedFromAnalysis);
  const collateralDebtWon = includedDebts
    .filter(isDebtCollateralLoan)
    .reduce((sum, debt) => sum + debt.currentBalanceWon, 0);
  const unsecuredDebtWon = includedDebts
    .filter((debt) => !isDebtCollateralLoan(debt))
    .reduce((sum, debt) => sum + debt.currentBalanceWon, 0);
  const hasDetailedDebtAmounts = debts.length > 0;

  const debtTotalRows: DisplayRow[] = [
    {
      label: "담보대출합산",
      value: hasDetailedDebtAmounts
        ? formatWon(collateralDebtWon)
        : collateralBreakdown
          ? formatManwonAsWon(collateralBreakdown.collateralDebt)
          : "-",
    },
    {
      label: "무담보대출 합산",
      value: hasDetailedDebtAmounts
        ? formatWon(unsecuredDebtWon)
        : collateralBreakdown
          ? formatManwonAsWon(collateralBreakdown.unsecuredDebt)
          : "-",
    },
    {
      label: "총 합산",
      value: formatManwonAsWon(input.totalDebt),
      emphasize: true,
    },
  ];

  const businessHistory = input.isOperatingBusiness ? "있음" : "없음";
  const exclusionStatus =
    input.isExcludedIndustryForFreshStartFund == null
      ? "제외업종 여부 -"
      : input.isExcludedIndustryForFreshStartFund
        ? "제외업종 해당"
        : "제외업종 해당 없음";
  const previousFundApplicationStatus =
    input.hasPreviousFreshStartFundApplication == null
      ? "이전 신청 이력 -"
      : input.hasPreviousFreshStartFundApplication
        ? "이전 신청 이력 있음"
        : "이전 신청 이력 없음";

  const businessLines: SummaryLine[] = [
    {
      label: `’20.4월 ~ ’25.6월 중 개인사업자·소상공인으로 사업 영위한 적 ${businessHistory}`,
      emphasizeLabel: false,
    },
    {
      label: "현재 사업 상태",
      value: optionLabel(BUSINESS_OPERATION_STATUS_OPTIONS, input.businessOperationStatus),
    },
    {
      label: "부실·부실우려 해당 여부",
      value: freshStartFundInsolvencyReasonsLabel(input.freshStartFundInsolvencyReasons),
    },
    {
      label: "결격·이력 확인",
      value: `${exclusionStatus}, ${previousFundApplicationStatus}`,
    },
  ];

  const otherCheckLines: SummaryLine[] = [
    {
      label: `이전 개인회생 / 파산 신청 이력 ${input.hasPreviousBankruptcy ? "있음" : "없음"}`,
      value: input.hasPreviousBankruptcy ? input.previousBankruptcyNote?.trim() || undefined : undefined,
    },
    {
      label: `보증인 / 연대보증 관계 ${input.hasGuarantorRelation ? "있음" : "없음"}`,
      value: input.hasGuarantorRelation ? input.guarantorNote?.trim() || undefined : undefined,
    },
    {
      label: `현재 진행 중인 소송 / 압류 ${input.hasActiveLawsuit ? "있음" : "없음"}`,
      value: input.hasActiveLawsuit ? input.lawsuitNote?.trim() || undefined : undefined,
    },
  ];

  return {
    customerRows: sections.customerRows,
    assetRows,
    incomeRows: sections.incomeSummaryRows,
    debtRows,
    debtTotalRows,
    businessLines,
    otherCheckLines,
    counselorMemo: input.additionalNotes?.trim() || "-",
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

  if (!open) return null;

  const inputData = detail.inputData;
  const summaryLabel = [inputData.customerName, inputData.ageGroup, inputData.employmentType]
    .filter(Boolean)
    .join(" · ");
  const viewModel = buildCustomerInfoViewModel(
    inputData,
    detail.collateralBreakdown ?? inputData.collateralBreakdown
  );

  return (
    <>
      <BaseModal
        onClose={onClose}
        ariaLabel="고객정보"
        overlayClassName="bg-black/50 dark:bg-[#000000CC]"
        disableAutoContainerSizing
        containerClassName={[
          "flex h-[1342px] max-h-[90vh] w-full flex-col overflow-hidden",
          "bg-card dark:bg-neutral-10 rounded-[14px]",
          "drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:drop-shadow-none",
          "min-[709px]:max-w-[1062px]",
        ].join(" ")}
      >
        <div className="flex h-[76px] shrink-0 items-center gap-4 border-b border-neutral-30 px-5 min-[1024px]:px-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="뒤로가기"
            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center text-foreground hover:opacity-70"
          >
            <BackIcon />
          </button>
          <h2
            id="diagnosis-customer-info-title"
            className="shrink-0 text-[20px] font-bold leading-6 text-foreground min-[1024px]:text-[24px]"
          >
            고객정보
          </h2>
          {summaryLabel ? (
            <>
              <span className="h-4 w-px shrink-0 bg-neutral-60" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5 text-neutral-60 min-[1024px]:text-[18px]">
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
            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center text-foreground hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[30px] pt-5 min-[1024px]:px-7">
          <div className="grid grid-cols-1 gap-5 min-[1024px]:grid-cols-[314px_minmax(0,672px)]">
            <InfoSection title="고객 정보">
              <InfoRows rows={viewModel.customerRows} />
            </InfoSection>

            <InfoSection title="자산현황">
              <RichInfoRows rows={viewModel.assetRows} />
            </InfoSection>

            <InfoSection title="소득 / 지출">
              <InfoRows rows={viewModel.incomeRows} />
            </InfoSection>

            <InfoSection
              title="채무현황"
              titleAction={
                <button
                  type="button"
                  onClick={() => setDebtDetailOpen(true)}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded-[5px] border border-secondary-20 bg-white px-2 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10 dark:border-secondary-40 dark:bg-neutral-10 dark:hover:bg-neutral-20"
                >
                  <DebtDetailSearchIcon />
                  자세히 보기
                </button>
              }
            >
              <div className="flex h-full flex-col gap-3">
                <RichInfoRows rows={viewModel.debtRows} />
                <div className="mt-auto pt-1">
                  <InfoRows rows={viewModel.debtTotalRows} />
                </div>
              </div>
            </InfoSection>

            <InfoSection
              title="기타사항"
              className="min-[1024px]:col-span-2 min-[1024px]:min-h-[372px]"
            >
              <ContentRows
                rows={[
                  {
                    key: "fresh-start-fund",
                    label: "새출발기금",
                    content: <SummaryLines lines={viewModel.businessLines} />,
                  },
                  {
                    key: "other-checks",
                    label: "기타 확인 사항",
                    content: <SummaryLines lines={viewModel.otherCheckLines} />,
                  },
                  {
                    key: "counselor-memo",
                    label: "상담사 메모",
                    content: (
                      <p className="whitespace-pre-line font-normal text-neutral-80">
                        {viewModel.counselorMemo}
                      </p>
                    ),
                  },
                ]}
              />
            </InfoSection>
          </div>
        </div>

        <div className="flex h-[59px] shrink-0 items-center justify-end border-t border-neutral-30 px-5 min-[1024px]:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] w-[72px] cursor-pointer rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-neutral-20 hover:opacity-90"
          >
            확인
          </button>
        </div>
      </BaseModal>

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
