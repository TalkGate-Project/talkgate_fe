import type {
  ConditionItem,
  CreateDiagnosisResult,
  CreditorCountRange,
  DebtComposition,
  DebtType,
  DependentCount,
  DiagnosisDetail,
  DiagnosisFormState,
  DiagnosisHubSummary,
  DiagnosisListItem,
  DiagnosisListQuery,
  DiagnosisListResult,
  DiagnosisSortField,
  DebtCause,
  FinancialAssetRange,
  MonthlyIncomeRange,
  OverduePeriod,
  ProcedureGrade,
  ProcedureGuide,
  ProcedureScore,
  ProcedureStep,
  ProcedureStepNoteType,
  RealEstateType,
  RecommendedProcedure,
  SendGuidanceSmsInput,
  SendGuidanceSmsResult,
  SortDirection,
  VehicleRange,
} from "@/types/debtRelief";
import {
  AGE_GROUP_OPTIONS,
  CREDITOR_COUNT_TO_NUMBER,
  EMPLOYMENT_TYPE_OPTIONS,
  RECOMMENDED_PROCEDURE_LABEL,
  REGION_OPTIONS,
} from "@/types/debtRelief";
import { AnalysisService } from "@/services/analysis";
import { CustomersService } from "@/services/customers";
import type {
  AnalysisDebtBreakdown,
  AnalysisDebtCause,
  AnalysisFinancialAssetRange,
  AnalysisFormInput,
  AnalysisInputData,
  AnalysisListItem,
  AnalysisMonthlyIncomeRange,
  AnalysisOverduePeriod,
  AnalysisProcedureConditions,
  AnalysisProcedureConditionsMap,
  AnalysisProcedureGuide,
  AnalysisProcedureStepDetails,
  AnalysisProcedureType,
  AnalysisRealEstateBreakdown,
  AnalysisScores,
  AnalysisSortOrder,
  AnalysisSortType,
  AnalysisVehicleValueRange,
  CreateAnalysisInput,
} from "@/types/analysis";

// sendGuidanceSms(문자 발송, 2026-07-14 연동): AnalysisService.sendSms(POST
// /v1/analysis/{id}/send-sms)로 위임한다. 수신자는 서버가 결정(공유 시 전달받은 contact 우선,
// 없으면 매칭된 고객 연락처)하므로 recipientName/recipientPhone은 API 호출엔 쓰이지 않고
// 모달 UI 표시용으로만 남아있다. 목록 정렬은 GET /v1/analysis의
// sortType/sortOrder로 서버에 위임한다(현재 sortType은 consultationDate만 지원). AI 채팅은
// useDebtReliefAiChat 훅이 AnalysisService.chatHistory/streamChatMessage로 별도 연동한다
// (DiagnosisDetail 타입에는 대화 내역을 담지 않음).
//
// getDiagnosisForm/updateDiagnosis(2026-07-14 연동): AnalysisService.detail().inputData를
// fromAnalysisFormInput으로 역매핑해 폼을 채우고, 제출은 AnalysisService.reanalyze(PATCH
// /v1/analysis/{id}/input)로 위임한다. toAnalysisFormInput의 *_TO_ANALYSIS 매핑들을 반대
// 방향(*_FROM_ANALYSIS)으로 뒤집은 것 — ageGroup/region/employmentType은 실 API에 라벨
// 문자열로 저장되어 optionValueFromLabel로 복원한다. 유일한 예외: 캐피탈/저축은행은 API에
// capitalLoan 슬롯 하나로만 남아 원본 선택을 알 수 없어서, 애초에 폼에서도 "캐피탈/저축은행"
// 단일 선택지로 합쳐 근본적으로 해소했다(DebtType 참고).
//
// ⚠️ reanalyze는 성공 시 status/trackingProcedure/currentProcedureStep을 초기화하고 AI 채팅
// 이력을 삭제한다(analysis.ts:69-71 참고). DiagnosisFormContent.tsx의 handleAnalyze는 아직
// 이걸 사용자에게 안내하는 확인 모달이 없다 — 되돌릴 수 없는 부수효과이니 추가를 검토할 것.

// mock 도메인(individual_rehab)과 실 API(individual_rehabilitation)의 절차 코드값이 다르다.
const PROCEDURE_TO_ANALYSIS: Record<RecommendedProcedure, AnalysisProcedureType> = {
  individual_rehab: "individual_rehabilitation",
  debt_adjustment: "debt_adjustment",
  bankruptcy: "bankruptcy",
};

const PROCEDURE_FROM_ANALYSIS: Record<AnalysisProcedureType, RecommendedProcedure> = {
  individual_rehabilitation: "individual_rehab",
  debt_adjustment: "debt_adjustment",
  bankruptcy: "bankruptcy",
};

// 허브 정렬 필드 → GET /v1/analysis sortType. 지원되지 않는 필드는 매핑에서 제외한다.
const SORT_FIELD_TO_ANALYSIS: Record<DiagnosisSortField, AnalysisSortType> = {
  consultedAt: "consultationDate",
};

const SORT_DIRECTION_TO_ANALYSIS: Record<SortDirection, AnalysisSortOrder> = {
  asc: "ASC",
  desc: "DESC",
};

const DEPENDENTS_TO_ANALYSIS: Record<DependentCount, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4_plus": 4,
};

const DEPENDENTS_FROM_ANALYSIS: Record<number, DependentCount> = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4_plus",
};

const FINANCIAL_ASSET_TO_ANALYSIS: Record<FinancialAssetRange, AnalysisFinancialAssetRange> = {
  none: "none",
  under_500: "under_500",
  "500_2000": "500_to_2000",
  "2000_5000": "2000_to_5000",
  over_5000: "over_5000",
};

const FINANCIAL_ASSET_FROM_ANALYSIS: Record<AnalysisFinancialAssetRange, FinancialAssetRange> = {
  none: "none",
  under_500: "under_500",
  "500_to_2000": "500_2000",
  "2000_to_5000": "2000_5000",
  over_5000: "over_5000",
};

const VEHICLE_TO_ANALYSIS: Record<VehicleRange, AnalysisVehicleValueRange> = {
  none: "none",
  under_500: "under_500",
  "500_2000": "500_to_2000",
  over_2000: "over_2000",
};

const VEHICLE_FROM_ANALYSIS: Record<AnalysisVehicleValueRange, VehicleRange> = {
  none: "none",
  under_500: "under_500",
  "500_to_2000": "500_2000",
  over_2000: "over_2000",
};

const OVERDUE_PERIOD_TO_ANALYSIS: Record<OverduePeriod, AnalysisOverduePeriod> = {
  none: "none",
  under_3m: "under_3_months",
  "3_6m": "3_to_6_months",
  "6_12m": "6_to_12_months",
  over_1y: "over_1_year",
};

const OVERDUE_PERIOD_FROM_ANALYSIS: Record<AnalysisOverduePeriod, OverduePeriod> = {
  none: "none",
  under_3_months: "under_3m",
  "3_to_6_months": "3_6m",
  "6_to_12_months": "6_12m",
  over_1_year: "over_1y",
};

const MONTHLY_INCOME_TO_ANALYSIS: Record<MonthlyIncomeRange, AnalysisMonthlyIncomeRange> = {
  under_100: "under_100",
  "100_200": "100_to_200",
  "200_300": "200_to_300",
  "300_400": "300_to_400",
  over_400: "over_400",
};

const MONTHLY_INCOME_FROM_ANALYSIS: Record<AnalysisMonthlyIncomeRange, MonthlyIncomeRange> = {
  under_100: "under_100",
  "100_to_200": "100_200",
  "200_to_300": "200_300",
  "300_to_400": "300_400",
  over_400: "over_400",
};

const DEBT_CAUSE_TO_ANALYSIS: Record<DebtCause, AnalysisDebtCause> = {
  business_failure: "business_failure",
  living_expenses: "living_expenses",
  medical: "medical_expenses",
  investment_loss: "investment_loss",
  guarantee_damage: "guarantee_damage",
  other: "other",
};

const DEBT_CAUSE_FROM_ANALYSIS: Record<AnalysisDebtCause, DebtCause> = {
  business_failure: "business_failure",
  living_expenses: "living_expenses",
  medical_expenses: "medical",
  investment_loss: "investment_loss",
  guarantee_damage: "guarantee_damage",
  other: "other",
};

const DEBT_TYPE_TO_BREAKDOWN_KEY: Record<DebtType, keyof AnalysisDebtBreakdown> = {
  bank_loan: "bankLoan",
  card_loan: "cardDebt",
  capital: "capitalLoan",
  private_loan: "privateDebt",
  personal_borrowing: "personalBorrowing",
};

const BREAKDOWN_KEY_TO_DEBT_TYPE: Record<keyof AnalysisDebtBreakdown, DebtType> = {
  bankLoan: "bank_loan",
  cardDebt: "card_loan",
  capitalLoan: "capital",
  privateDebt: "private_loan",
  personalBorrowing: "personal_borrowing",
};

const REAL_ESTATE_TYPE_TO_BREAKDOWN_KEY: Record<RealEstateType, keyof AnalysisRealEstateBreakdown> = {
  owned: "ownedValue",
  jeonse_deposit: "jeonseDeposit",
  rental_income: "rentalValue",
};

const BREAKDOWN_KEY_TO_REAL_ESTATE_TYPE: Record<keyof AnalysisRealEstateBreakdown, RealEstateType> = {
  ownedValue: "owned",
  jeonseDeposit: "jeonse_deposit",
  rentalValue: "rental_income",
};

// 채권자 수는 구간 대표값(number)만 API에 남아 정확한 구간을 복원할 수 없을 수 있다
// (예: 서버가 5~7 사이 값을 돌려주면 어느 구간에도 정확히 맞지 않는다). 자체 생성 분석은
// 항상 CREDITOR_COUNT_TO_NUMBER의 대표값 중 하나로 보내므로 실질적으로는 발생하지 않지만,
// 방어적으로 가장 가까운 구간으로 근사한다.
const CREDITOR_COUNT_RANGES: { range: CreditorCountRange; representative: number }[] = (
  Object.entries(CREDITOR_COUNT_TO_NUMBER) as [CreditorCountRange, number][]
).map(([range, representative]) => ({ range, representative }));

function creditorCountFromNumber(value: number): CreditorCountRange {
  const exact = CREDITOR_COUNT_RANGES.find((entry) => entry.representative === value);
  if (exact) return exact.range;
  return CREDITOR_COUNT_RANGES.reduce((closest, entry) =>
    Math.abs(entry.representative - value) < Math.abs(closest.representative - value) ? entry : closest
  ).range;
}

function optionLabel<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

// optionLabel의 역함수. 서버가 우리가 보낸 라벨을 그대로 echo한다는 전제(2026-07-14 기준
// 확인됨) 하에 라벨 → 코드로 되돌린다. 못 찾으면 null(폼에서 미선택 상태로 취급).
function optionValueFromLabel<T extends string>(
  options: { value: T; label: string }[],
  label: string
): T | null {
  return options.find((option) => option.label === label)?.value ?? null;
}

// 실 API가 요구하는 필수값 중 폼에서 null일 수 있는 항목이 채워졌다는 전제 하에 호출한다.
// (호출 전 반드시 validateDiagnosisForm의 getMissingRequiredFieldLabels로 검증)
// 생성(POST /v1/analysis)과 재분석(PATCH /v1/analysis/{id}/input)이 동일한 입력 형태를
// 쓰므로 공통 매핑만 여기서 만들고, projectId/customerId 등 나머지는 호출부에서 붙인다.
function toAnalysisFormInput(form: DiagnosisFormState): AnalysisFormInput {
  const debtBreakdown: AnalysisDebtBreakdown = {};
  form.debtTypes.forEach((type) => {
    const key = DEBT_TYPE_TO_BREAKDOWN_KEY[type];
    debtBreakdown[key] = (debtBreakdown[key] ?? 0) + (form.debtAmounts[type] ?? 0);
  });

  const realEstateBreakdown: AnalysisRealEstateBreakdown = {};
  form.realEstateTypes.forEach((type) => {
    const key = REAL_ESTATE_TYPE_TO_BREAKDOWN_KEY[type];
    realEstateBreakdown[key] = (realEstateBreakdown[key] ?? 0) + (form.realEstateAmounts[type] ?? 0);
  });

  return {
    customerName: form.customerName.trim(),
    gender: form.gender!,
    ageGroup: optionLabel(AGE_GROUP_OPTIONS, form.ageGroup!),
    region: optionLabel(REGION_OPTIONS, form.region!),
    employmentType: optionLabel(EMPLOYMENT_TYPE_OPTIONS, form.employmentType!),
    dependents: DEPENDENTS_TO_ANALYSIS[form.dependents!],
    hasSpouseIncome: Boolean(form.spouseIncome),
    monthlyIncomeRange: MONTHLY_INCOME_TO_ANALYSIS[form.monthlyIncome!],
    housingType: form.housingType!,
    fixedExpenses: {
      housingCost: form.expenses.housing,
      foodCost: form.expenses.food,
      educationCost: form.expenses.education,
      transportCost: form.expenses.transportation,
      otherFixedCost: form.expenses.other,
    },
    debtBreakdown,
    overduePeriod: OVERDUE_PERIOD_TO_ANALYSIS[form.overduePeriod!],
    debtCauses: form.debtCauses.map((cause) => DEBT_CAUSE_TO_ANALYSIS[cause]),
    realEstateBreakdown,
    financialAssetRange: FINANCIAL_ASSET_TO_ANALYSIS[form.financialAsset!],
    vehicleValueRange: VEHICLE_TO_ANALYSIS[form.vehicle!],
    hasPreviousBankruptcy: form.hasPreviousApplication,
    previousBankruptcyNote: form.previousApplicationDetail || undefined,
    hasGuarantorRelation: form.hasGuarantor,
    guarantorNote: form.guarantorDetail || undefined,
    hasActiveLawsuit: form.hasOngoingLitigation,
    lawsuitNote: form.litigationDetail || undefined,
    creditorCount: form.creditorCount
      ? CREDITOR_COUNT_TO_NUMBER[form.creditorCount]
      : undefined,
    hasTaxArrears: form.hasTaxArrears,
    hasRecentAssetDisposal: form.hasRecentAssetDisposal,
    additionalNotes: form.counselorMemo || undefined,
  };
}

function toCreateAnalysisInput(
  projectId: string,
  form: DiagnosisFormState,
  customerId?: number
): CreateAnalysisInput {
  return { projectId, customerId, ...toAnalysisFormInput(form) };
}

// toAnalysisFormInput의 역함수. 편집 진입 시 GET /v1/analysis/{id}의 inputData를 폼 상태로 되돌린다.
// ageGroup/region/employmentType은 실 API에 라벨 문자열로 저장되어 있어 옵션 라벨 역조회로 복원한다.
function fromAnalysisFormInput(input: AnalysisInputData): DiagnosisFormState {
  const realEstateTypes: RealEstateType[] = [];
  const realEstateAmounts: Partial<Record<RealEstateType, number>> = {};
  (Object.keys(input.realEstateBreakdown) as (keyof AnalysisRealEstateBreakdown)[]).forEach((key) => {
    const amount = input.realEstateBreakdown[key];
    if (!amount) return;
    const type = BREAKDOWN_KEY_TO_REAL_ESTATE_TYPE[key];
    realEstateTypes.push(type);
    realEstateAmounts[type] = amount;
  });

  const debtTypes: DebtType[] = [];
  const debtAmounts: Partial<Record<DebtType, number>> = {};
  (Object.keys(input.debtBreakdown) as (keyof AnalysisDebtBreakdown)[]).forEach((key) => {
    const amount = input.debtBreakdown[key];
    if (!amount) return;
    const type = BREAKDOWN_KEY_TO_DEBT_TYPE[key];
    debtTypes.push(type);
    debtAmounts[type] = amount;
  });

  return {
    customerName: input.customerName,
    gender: input.gender,
    ageGroup: optionValueFromLabel(AGE_GROUP_OPTIONS, input.ageGroup),
    region: optionValueFromLabel(REGION_OPTIONS, input.region),
    employmentType: optionValueFromLabel(EMPLOYMENT_TYPE_OPTIONS, input.employmentType),
    dependents: DEPENDENTS_FROM_ANALYSIS[input.dependents] ?? null,
    spouseIncome: input.hasSpouseIncome,
    realEstateTypes,
    realEstateAmounts,
    financialAsset: FINANCIAL_ASSET_FROM_ANALYSIS[input.financialAssetRange] ?? null,
    vehicle: VEHICLE_FROM_ANALYSIS[input.vehicleValueRange] ?? null,
    hasRecentAssetDisposal: input.hasRecentAssetDisposal ?? false,
    debtTypes,
    debtAmounts,
    overduePeriod: OVERDUE_PERIOD_FROM_ANALYSIS[input.overduePeriod] ?? null,
    debtCauses: input.debtCauses.map((cause) => DEBT_CAUSE_FROM_ANALYSIS[cause]),
    creditorCount: input.creditorCount != null ? creditorCountFromNumber(input.creditorCount) : null,
    hasTaxArrears: input.hasTaxArrears ?? false,
    monthlyIncome: MONTHLY_INCOME_FROM_ANALYSIS[input.monthlyIncomeRange] ?? null,
    housingType: input.housingType,
    expenses: {
      housing: input.fixedExpenses.housingCost ?? 0,
      food: input.fixedExpenses.foodCost ?? 0,
      education: input.fixedExpenses.educationCost ?? 0,
      transportation: input.fixedExpenses.transportCost ?? 0,
      other: input.fixedExpenses.otherFixedCost ?? 0,
    },
    hasPreviousApplication: input.hasPreviousBankruptcy,
    previousApplicationDetail: input.previousBankruptcyNote ?? "",
    hasGuarantor: input.hasGuarantorRelation,
    guarantorDetail: input.guarantorNote ?? "",
    hasOngoingLitigation: input.hasActiveLawsuit,
    litigationDetail: input.lawsuitNote ?? "",
    counselorMemo: input.additionalNotes ?? "",
  };
}

function resolveAgeGroupLabel(ageGroup?: string | null): string | undefined {
  if (!ageGroup) return undefined;
  const matched = AGE_GROUP_OPTIONS.find((option) => option.value === ageGroup);
  return matched?.label ?? ageGroup;
}

function toDiagnosisListItem(item: AnalysisListItem): DiagnosisListItem {
  const assigneeName = item.sourceAssignedMemberName ?? item.sourceMemberName ?? undefined;
  const assigneeProfileImageUrl =
    item.sourceAssignedMemberProfileImageUrl ?? item.sourceMemberProfileImageUrl ?? undefined;

  return {
    id: String(item.id),
    customerName: item.customerName,
    age: typeof item.age === "number" ? item.age : undefined,
    ageGroupLabel: resolveAgeGroupLabel(item.ageGroup),
    gender: item.gender ?? undefined,
    region: item.region,
    totalDebtManwon: item.totalDebt,
    monthlyAvailableIncomeManwon: item.disposableIncome,
    status: item.status,
    recommendedProcedure: item.procedure ? PROCEDURE_FROM_ANALYSIS[item.procedure] : undefined,
    feePlanSummary: item.feePlan,
    // 아직 절차 추적을 시작하지 않아 null이면 1단계로 표시
    progressStep: item.currentProcedureStep ?? 1,
    isShared: item.isShared,
    isCustomerConnected: item.isCustomerConnected,
    consultedAt: item.createdAt.slice(0, 10),
    assigneeName: assigneeName || undefined,
    assigneeProfileImageUrl: assigneeProfileImageUrl || undefined,
    assigneeProjectName: item.sourceProjectName ?? undefined,
  };
}

// AnalysisScores/AnalysisProcedureConditionsMap/AnalysisProcedureGuidesMap이 공유하는 키 형식.
const PROCEDURE_TO_SCORE_KEY: Record<AnalysisProcedureType, keyof AnalysisScores> = {
  individual_rehabilitation: "individualRehabilitation",
  debt_adjustment: "debtAdjustment",
  bankruptcy: "bankruptcy",
};

// 절차별 점수 → 등급. 실 API에 등급 필드가 없어 클라이언트에서 임계값으로 판정한다.
function scoreToGrade(score: number): ProcedureGrade {
  if (score >= 70) return "good";
  if (score >= 40) return "normal";
  return "low";
}

// 연체기간은 실 API에 구간(enum)만 있고 정확한 개월 수가 없어 대표값으로 근사한다.
// (MONTHLY_INCOME_ESTIMATE와 동일한 방식)
const OVERDUE_MONTHS_ESTIMATE: Record<AnalysisOverduePeriod, number> = {
  none: 0,
  under_3_months: 1,
  "3_to_6_months": 4,
  "6_to_12_months": 9,
  over_1_year: 18,
};

// 금융자산/차량가액은 실 API에 구간만 있어 대표값(만원)으로 근사한다.
// (부동산은 inputData.totalRealEstateValue로 정확한 값을 받으므로 근사 불필요)
const FINANCIAL_ASSET_ESTIMATE: Record<AnalysisFinancialAssetRange, number> = {
  none: 0,
  under_500: 250,
  "500_to_2000": 1250,
  "2000_to_5000": 3500,
  over_5000: 6000,
};

const VEHICLE_VALUE_ESTIMATE: Record<AnalysisVehicleValueRange, number> = {
  none: 0,
  under_500: 250,
  "500_to_2000": 1250,
  over_2000: 2500,
};

// analysisResult.expectedRepayment 금액 필드는 대부분 원(KRW) 단위다.
// 다만 expectedExemption은 이 상세 화면에서만 예외적으로 이미 만원 단위로 내려온다.
// 폼/채무현황 등 나머지 UI는 만원 단위이므로 필요한 필드만 변환한다.
function wonToManwon(won: number): number {
  return Math.round(won / 10_000);
}

const BREAKDOWN_LABEL: Record<keyof AnalysisDebtBreakdown, string> = {
  bankLoan: "은행대출",
  cardDebt: "카드론",
  capitalLoan: "캐피탈/저축은행",
  privateDebt: "사채",
  personalBorrowing: "개인차용",
};

function buildDebtComposition(
  debtBreakdown: AnalysisDebtBreakdown,
  totalDebt: number
): DebtComposition[] {
  const keys: (keyof AnalysisDebtBreakdown)[] = [
    "bankLoan",
    "cardDebt",
    "capitalLoan",
    "privateDebt",
    "personalBorrowing",
  ];
  return keys
    .map((key) => {
      const amountManwon = debtBreakdown[key] ?? 0;
      return {
        label: BREAKDOWN_LABEL[key],
        amountManwon,
        percent: totalDebt > 0 ? Math.round((amountManwon / totalDebt) * 100) : 0,
      };
    })
    .filter((item) => item.amountManwon > 0);
}

function buildConditionAnalysis(conditions: AnalysisProcedureConditions): ConditionItem[] {
  return [
    ...conditions.satisfied.map((text) => ({ status: "met" as const, text })),
    ...conditions.needsSupplement.map((text) => ({ status: "caution" as const, text })),
    ...conditions.riskFactors.map((text) => ({ status: "risk" as const, text })),
  ];
}

function buildConditionAnalysisByProcedure(
  conditions: AnalysisProcedureConditionsMap
): Record<RecommendedProcedure, ConditionItem[]> {
  return (Object.keys(PROCEDURE_TO_SCORE_KEY) as AnalysisProcedureType[]).reduce(
    (acc, procedure) => {
      acc[PROCEDURE_FROM_ANALYSIS[procedure]] = buildConditionAnalysis(
        conditions[PROCEDURE_TO_SCORE_KEY[procedure]]
      );
      return acc;
    },
    {} as Record<RecommendedProcedure, ConditionItem[]>
  );
}

function buildProcedureScores(
  scores: AnalysisScores,
  recommendation: AnalysisProcedureType
): ProcedureScore[] {
  return (Object.keys(PROCEDURE_TO_SCORE_KEY) as AnalysisProcedureType[]).map((procedure) => {
    const score = scores[PROCEDURE_TO_SCORE_KEY[procedure]];
    return {
      procedure: PROCEDURE_FROM_ANALYSIS[procedure],
      label: RECOMMENDED_PROCEDURE_LABEL[PROCEDURE_FROM_ANALYSIS[procedure]],
      score,
      grade: scoreToGrade(score),
      recommended: procedure === recommendation,
    };
  });
}

// 절차 단계 상세의 caution/example/note 중 하나를 골라 안내 배지로 표시 (우선순위: 주의 > 예시 > 참고)
function pickProcedureStepNote(
  details: AnalysisProcedureStepDetails
): { note?: string; noteType?: ProcedureStepNoteType } {
  if (details.caution) return { note: details.caution, noteType: "warning" };
  if (details.example) return { note: details.example, noteType: "info" };
  if (details.note) return { note: details.note, noteType: "default" };
  return {};
}

function buildProcedureGuide(
  guide: AnalysisProcedureGuide,
  currentProcedureStep: number | null
): ProcedureGuide {
  const steps: ProcedureStep[] = guide.steps.map((step, index) => {
    const { note, noteType } = pickProcedureStepNote(step.details);
    return {
      step: index + 1,
      stepId: step.stepId,
      title: step.title,
      period: step.durationLabel,
      detail: step.details.desc,
      checklist: step.details.items,
      note,
      noteType,
      status: step.isCompleted ? "done" : step.isCurrent ? "in_progress" : "pending",
    };
  });

  // currentProcedureStep은 stepId를 저장하는 것으로 보고 배열에서 찾아 1-based 위치로 변환한다.
  // 못 찾으면(아직 추적 시작 전 등) 1단계로 표시.
  const currentIndex = guide.steps.findIndex((step) => step.stepId === currentProcedureStep);
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 1;

  const remainingWeeks = guide.steps
    .slice(currentStep - 1)
    .reduce((sum, step) => sum + (step.durationWeeks || 0), 0);
  const estimatedRemainingMonths = Math.max(1, Math.round(remainingWeeks / 4.345));

  return {
    procedureLabel: `${guide.label} · ${guide.steps.length}단계`,
    totalSteps: guide.steps.length,
    currentStep,
    estimatedRemaining: `약 ${estimatedRemainingMonths}개월`,
    totalPeriodHint: guide.totalMonths,
    progressPercent: guide.steps.length > 0 ? Math.round((currentStep / guide.steps.length) * 100) : 0,
    steps,
  };
}

const EMPTY_PROCEDURE_GUIDE: ProcedureGuide = {
  procedureLabel: "",
  totalSteps: 0,
  currentStep: 1,
  estimatedRemaining: "-",
  totalPeriodHint: "-",
  progressPercent: 0,
  steps: [],
};

export const DebtReliefService = {
  // 대시보드 요약 카드 데이터 — GET /v1/analysis/summary를 허브 UI 형태로 매핑한다.
  async getHubSummary(projectId: string): Promise<DiagnosisHubSummary> {
    const response = await AnalysisService.summary(projectId);
    const data = response.data.data;

    const procedureDistribution: Record<RecommendedProcedure, number> = {
      individual_rehab: 0,
      debt_adjustment: 0,
      bankruptcy: 0,
    };
    for (const item of data.procedureDistribution ?? []) {
      const key = PROCEDURE_FROM_ANALYSIS[item.procedure];
      if (key) procedureDistribution[key] = item.count;
    }

    const progressStepsByProcedure: Record<RecommendedProcedure, { step: number; title?: string; count: number }[]> = {
      individual_rehab: [],
      debt_adjustment: [],
      bankruptcy: [],
    };
    for (const procedure of data.stepProgressByProcedure ?? []) {
      const key = PROCEDURE_FROM_ANALYSIS[procedure.procedure];
      if (!key) continue;
      progressStepsByProcedure[key] = (procedure.steps ?? [])
        .map((step) => ({
          step: step.stepId,
          title: step.title,
          count: step.count,
        }))
        .sort((a, b) => a.step - b.step);
    }

    return {
      totalAnalysisCount: data.totalCount,
      thisMonthCount: data.monthlyCount,
      averageSuccessProbability: Math.round(data.averageSuccessProbability ?? 0),
      procedureDistribution,
      progressStepsByProcedure,
    };
  },

  // 진단 목록 (필터·검색·페이지네이션·정렬은 GET /v1/analysis 쿼리로 서버에 위임)
  async listDiagnoses(query: DiagnosisListQuery): Promise<DiagnosisListResult> {
    const { projectId, page, limit, procedure, status, keyword = "", sortField, sortDirection = "desc" } = query;

    const response = await AnalysisService.list({
      projectId,
      page,
      limit,
      procedure: procedure ? PROCEDURE_TO_ANALYSIS[procedure] : undefined,
      status,
      search: keyword.trim() || undefined,
      sortType: sortField ? SORT_FIELD_TO_ANALYSIS[sortField] : undefined,
      sortOrder: sortField ? SORT_DIRECTION_TO_ANALYSIS[sortDirection] : undefined,
    });

    const { items, total, page: responsePage, limit: responseLimit } = response.data.data;

    return {
      items: items.map(toDiagnosisListItem),
      totalCount: total,
      page: responsePage,
      limit: responseLimit,
    };
  },

  // 진단 생성(AI 분석 요청). 호출 전 UI에서 getMissingRequiredFieldLabels로 필수값을 검증해야 한다.
  async createDiagnosis(
    projectId: string,
    form: DiagnosisFormState,
    customerId?: number
  ): Promise<CreateDiagnosisResult> {
    const response = await AnalysisService.create(toCreateAnalysisInput(projectId, form, customerId));
    return { id: String(response.data.data.id) };
  },

  // 진단 결과 상세 (읽기 전용 섹션). AI 채팅/문자 실발송/고객 매칭은 아직 미연동(다음 phase).
  async getDiagnosisDetail(projectId: string, id: string): Promise<DiagnosisDetail> {
    const response = await AnalysisService.detail(Number(id), projectId);
    const analysis = response.data.data;
    const inputData = analysis.inputData;

    const recommendation: AnalysisProcedureType =
      analysis.analysisResult?.recommendation ?? analysis.trackingProcedure ?? "individual_rehabilitation";
    const recommendedProcedure = PROCEDURE_FROM_ANALYSIS[recommendation];
    const scoreKey = PROCEDURE_TO_SCORE_KEY[recommendation];
    const successProbability = analysis.analysisResult?.scores[scoreKey] ?? 0;

    // AI 추천(recommendation)과 별개로, 실제 상담사가 추적 중인 절차. 아직 추적을 시작하지
    // 않았다면(trackingProcedure가 null) AI 추천으로 대체 표시한다.
    const trackingProcedureCode: AnalysisProcedureType = analysis.trackingProcedure ?? recommendation;
    const trackingProcedure = PROCEDURE_FROM_ANALYSIS[trackingProcedureCode];

    // 공유(납품) contact를 우선 사용. 변호사 프로젝트에서는 원본 고객 도메인에 없을 수 있음.
    let phone = analysis.contact?.trim() ? analysis.contact : "";
    if (!phone && analysis.customerId != null && !analysis.isShared) {
      try {
        const customerRes = await CustomersService.detail(String(analysis.customerId)).withProject(
          projectId
        );
        phone = customerRes.data?.data?.contact1 ?? "";
      } catch (error) {
        console.error("Failed to load matched customer contact:", error);
      }
    }

    const guideKey = PROCEDURE_TO_SCORE_KEY[trackingProcedureCode];
    const guide = analysis.procedureGuides?.[guideKey];
    const totalDebt = inputData.totalDebt;
    const assigneeName =
      analysis.sourceAssignedMemberName ?? analysis.sourceMemberName ?? undefined;
    const assigneeProfileImageUrl =
      analysis.sourceAssignedMemberProfileImageUrl ??
      analysis.sourceMemberProfileImageUrl ??
      undefined;

    return {
      id: String(analysis.id),
      customerName: inputData.customerName,
      ageGroupLabel: inputData.ageGroup,
      gender: inputData.gender,
      occupation: inputData.employmentType,
      phone,
      customerId: analysis.customerId,
      consultedAt: analysis.createdAt,
      isShared: analysis.isShared,
      status: analysis.status,
      rejectionReason: analysis.rejectionReason ?? null,
      assigneeName: assigneeName || undefined,
      assigneeProfileImageUrl: assigneeProfileImageUrl || undefined,
      assigneeProjectName: analysis.sourceProjectName ?? undefined,
      recommendedProcedure,
      trackingProcedure,
      successProbability,
      recommendation: {
        title: RECOMMENDED_PROCEDURE_LABEL[recommendedProcedure],
        description: analysis.analysisResult?.consultingScripts.firstExplanation ?? "",
        tags: analysis.analysisResult?.procedureConditions[scoreKey].satisfied ?? [],
      },
      procedureScores: analysis.analysisResult
        ? buildProcedureScores(analysis.analysisResult.scores, recommendation)
        : [],
      conditionAnalysis: analysis.analysisResult
        ? buildConditionAnalysis(analysis.analysisResult.procedureConditions[scoreKey])
        : [],
      conditionAnalysisByProcedure: analysis.analysisResult
        ? buildConditionAnalysisByProcedure(analysis.analysisResult.procedureConditions)
        : { individual_rehab: [], debt_adjustment: [], bankruptcy: [] },
      debtStatus: {
        totalDebtManwon: totalDebt,
        totalAssetManwon:
          inputData.totalRealEstateValue +
          FINANCIAL_ASSET_ESTIMATE[inputData.financialAssetRange] +
          VEHICLE_VALUE_ESTIMATE[inputData.vehicleValueRange],
        monthlyAvailableIncomeManwon: inputData.disposableIncome,
        overdueMonths: OVERDUE_MONTHS_ESTIMATE[inputData.overduePeriod],
        composition: buildDebtComposition(inputData.debtBreakdown, totalDebt),
      },
      repaymentPlan: analysis.analysisResult
        ? {
            monthlyPaymentManwon: wonToManwon(analysis.analysisResult.expectedRepayment.monthlyPayment),
            months: analysis.analysisResult.expectedRepayment.periodMonths,
            years: Math.round((analysis.analysisResult.expectedRepayment.periodMonths / 12) * 10) / 10,
            totalPaymentManwon: wonToManwon(analysis.analysisResult.expectedRepayment.totalPayment),
            exemptedDebtManwon: analysis.analysisResult.expectedRepayment.expectedExemption,
            notes: analysis.analysisResult.precautions,
          }
        : { monthlyPaymentManwon: 0, months: 0, years: 0, totalPaymentManwon: 0, exemptedDebtManwon: 0, notes: [] },
      counselMents: analysis.analysisResult
        ? [
            { category: "core", text: analysis.analysisResult.consultingScripts.keyExplanation },
            { category: "concern", text: analysis.analysisResult.consultingScripts.concernResolution },
            { category: "next", text: analysis.analysisResult.consultingScripts.nextSteps },
          ]
        : [],
      // 실 API에 대응 필드 없음 — AI 생성 추천 질문 기능은 추후 재검토.
      aiSuggestedQuestions: [],
      procedureGuide: guide ? buildProcedureGuide(guide, analysis.currentProcedureStep) : EMPTY_PROCEDURE_GUIDE,
      procedureStepHistory: (analysis.procedureStepHistory ?? []).map((item) => ({
        stepId: item.stepId,
        changedByMemberName: item.changedByMemberName,
        changedByProjectName: item.changedByProjectName ?? null,
        changedAt: item.changedAt,
      })),
      inputData,
      contact: analysis.contact ?? null,
      referenceNote: analysis.referenceNote ?? null,
      feePlan: analysis.feePlan ?? null,
    };
  },

  // 절차안내 "현재 단계로 설정" 저장. step.stepId는 실 API의 procedureGuides[].steps[].stepId다.
  // currentProcedureStep을 생략하면(절차 전환 등) 서버가 단계를 초기화한다 — 이전 단계 값과 함께
  // 보내면 "단계는 순서대로 한 단계씩만 변경 가능" 오류(ANALYSIS_PROCEDURE_STEP_SKIP_NOT_ALLOWED)가 난다.
  async updateProcedureProgress(
    projectId: string,
    id: string,
    input: { trackingProcedure: RecommendedProcedure; currentProcedureStep?: number }
  ): Promise<void> {
    await AnalysisService.update(Number(id), {
      projectId,
      trackingProcedure: PROCEDURE_TO_ANALYSIS[input.trackingProcedure],
      currentProcedureStep: input.currentProcedureStep,
    });
  },

  // 편집(정보 수정) 진입 시 폼에 채울 원본 입력값 조회.
  async getDiagnosisForm(projectId: string, id: string): Promise<DiagnosisFormState> {
    const response = await AnalysisService.detail(Number(id), projectId);
    return fromAnalysisFormInput(response.data.data.inputData);
  },

  // 진단 수정(재분석 요청). 성공 시 서버가 status/trackingProcedure/currentProcedureStep을
  // 초기화하고 AI 채팅 이력을 삭제한다 — 호출 전 UI에서 사용자에게 안내가 되어 있어야 한다
  // (2026-07-14 기준 DiagnosisFormContent에는 별도 확인 모달이 없어 확인 필요).
  async updateDiagnosis(
    projectId: string,
    id: string,
    form: DiagnosisFormState
  ): Promise<CreateDiagnosisResult> {
    const response = await AnalysisService.reanalyze(Number(id), toCreateAnalysisInput(projectId, form));
    return { id: String(response.data.data.id) };
  },

  // 진단 삭제 (공유받은 분석 건은 백엔드에서 거부될 수 있음)
  async deleteDiagnosis(projectId: string, id: string): Promise<void> {
    await AnalysisService.remove(Number(id), projectId);
  },

  // 진단 일괄 삭제 (자체 생성 건만). POST /v1/analysis/bulk-delete
  async bulkDeleteDiagnoses(
    projectId: string,
    ids: string[]
  ): Promise<{ deletedCount: number; failedCount: number; failedAnalysisIds: number[] }> {
    const response = await AnalysisService.bulkDelete({
      projectId,
      deleteType: "ids",
      analysisIds: ids.map(Number),
      expectedCount: ids.length,
    });
    const data = response.data.data;
    return {
      deletedCount: data.deletedCount,
      failedCount: data.failedCount,
      failedAnalysisIds: data.failedAnalysisIds ?? [],
    };
  },

  // 결과 상세 - 절차 안내 / 고객 안내 문자 발송. diagnosisId 기준으로 서버가 수신자를 결정한다.
  async sendGuidanceSms(
    projectId: string,
    input: SendGuidanceSmsInput
  ): Promise<SendGuidanceSmsResult> {
    const response = await AnalysisService.sendSms(Number(input.diagnosisId), projectId, {
      senderNumberType: input.senderNumberType,
      senderNumberId: input.senderNumberId,
      advertisementType: input.advertisementType,
      serviceName: input.serviceName,
      title: input.title,
      content: input.content,
      scheduledAt: input.scheduledAt,
      imageUrls: input.imageUrls,
    });
    return { success: response.data.result };
  },
};
