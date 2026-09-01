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
} from "@/types/debtRelief";
import { wonToManwon } from "@/components/debt-relief/format";

// 「고객정보」 모달(DiagnosisCustomerInfoModal)과 모바일 PDF(AnalysisPdfDocument)가 공유하는
// 순수 뷰모델. UI 컴포넌트(BaseModal, DebtDetailModal 등)를 참조하지 않아야 한다 — PDF는
// Worker에서 이 파일을 번들링해 생성하는데, UI 컴포넌트 쪽에 next/image 등 무거운 의존성이
// 섞여 있으면 그대로 Worker 번들에 딸려 들어가 파싱 비용이 커진다.

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
    { label: "배우자 재산", value: formatManwon(input.spouseHousingAssetValue) },
    { label: "2년 내 재산처분", value: yesNo(input.hasRecentAssetDisposal) },
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

  assetRows.push(
    {
      key: "spouse-property",
      label: "배우자 재산",
      title: formatManwon(input.spouseHousingAssetValue),
    },
    {
      key: "recent-asset-disposal",
      label: "2년 내 재산처분",
      title: yesNo(input.hasRecentAssetDisposal),
    }
  );

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
