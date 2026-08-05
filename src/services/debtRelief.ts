import type {
  ConditionItem,
  CreateDiagnosisResult,
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
  ProcedureGrade,
  ProcedureGuide,
  ProcedureScore,
  ProcedureStep,
  ProcedureStepNoteType,
  RealEstateType,
  RecommendedProcedure,
  RepaymentPlan,
  SendGuidanceSmsInput,
  SendGuidanceSmsResult,
  SortDirection,
  SpecialEligibilityType,
  VehicleRange,
} from "@/types/debtRelief";
import {
  AGE_GROUP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  RECOMMENDED_PROCEDURE_LABEL,
  REGION_OPTIONS,
} from "@/types/debtRelief";
import { AnalysisService } from "@/services/analysis";
import { CustomersService } from "@/services/customers";
import type {
  AnalysisDebtBreakdown,
  AnalysisDebtCause,
  AnalysisDebtItem,
  AnalysisDebtItemType,
  AnalysisExpectedRepayment,
  AnalysisExpectedRepaymentMap,
  AnalysisFinancialAssetRange,
  AnalysisFormInput,
  AnalysisInputData,
  AnalysisListItem,
  AnalysisMonthlyIncomeRange,
  AnalysisProcedureConditions,
  AnalysisProcedureConditionsMap,
  AnalysisProcedureGuide,
  AnalysisProcedureStepDetails,
  AnalysisProcedureType,
  AnalysisRealEstateBreakdown,
  AnalysisRepaymentMethod,
  AnalysisScores,
  AnalysisSortOrder,
  AnalysisSortType,
  AnalysisSpecialEligibility,
  AnalysisStatus,
  AnalysisVehicleValueRange,
  CreateAnalysisInput,
} from "@/types/analysis";
import { normalizeProcedureType, pickProcedureValue, procedureEntries } from "@/types/analysis";

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

// 2026-08-04: 도메인 절차 코드를 실 API enum 값으로 일원화하면서 PROCEDURE_TO_ANALYSIS /
// PROCEDURE_FROM_ANALYSIS 양방향 매핑을 제거했다(types/debtRelief.ts의 RecommendedProcedure 주석 참고).
// 절차 값은 이제 변환 없이 그대로 주고받는다.

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

const SPECIAL_ELIGIBILITY_TO_ANALYSIS: Record<SpecialEligibilityType, AnalysisSpecialEligibility> = {
  age_29_or_under: "under_29",
  age_65_or_over: "over_65",
  severe_disability: "severe_disability",
  jeonse_fraud_victim: "jeonse_fraud_victim",
};

const SPECIAL_ELIGIBILITY_FROM_ANALYSIS: Record<AnalysisSpecialEligibility, SpecialEligibilityType> = {
  under_29: "age_29_or_under",
  over_65: "age_65_or_over",
  severe_disability: "severe_disability",
  jeonse_fraud_victim: "jeonse_fraud_victim",
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

// 상세 채무 항목(debts[].debtType)은 간편모드의 폼 코드(DebtType)와 값이 다르다.
// 상세→간편 모드 전환 시 항목별 원금을 종류별 잔액으로 합산하는 데 쓴다.
const DEBT_ITEM_TYPE_TO_BREAKDOWN_KEY: Record<
  AnalysisDebtItemType,
  keyof AnalysisDebtBreakdown
> = {
  bank_loan: "bankLoan",
  card_debt: "cardDebt",
  capital_loan: "capitalLoan",
  private_debt: "privateDebt",
  personal_borrowing: "personalBorrowing",
};

const WON_PER_MANWON = 10000;

export function wonToManwon(won: number): number {
  return Math.round(won / WON_PER_MANWON);
}

export function manwonToWon(manwon: number): number {
  return manwon * WON_PER_MANWON;
}

/** 상세모드 채무 항목들을 간편모드의 종류별 잔액(만원)으로 집계 — 모드 전환/합계 표시용 */
export function aggregateDebtsToBreakdown(debts: AnalysisDebtItem[]): AnalysisDebtBreakdown {
  const breakdown: AnalysisDebtBreakdown = {
    bankLoan: 0,
    cardDebt: 0,
    capitalLoan: 0,
    privateDebt: 0,
    personalBorrowing: 0,
  };
  for (const debt of debts) {
    const key = DEBT_ITEM_TYPE_TO_BREAKDOWN_KEY[debt.debtType];
    breakdown[key] = (breakdown[key] ?? 0) + wonToManwon(debt.principalWon);
  }
  return breakdown;
}

/** "YYYY-MM-DD" 문자열을 로컬 자정 Date로 파싱. `new Date(isoString)`은 UTC로 해석돼
 * 시간대에 따라 하루 밀릴 수 있어 직접 분해해서 로컬 Date를 만든다. */
function parseDateOnly(iso?: string): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** 대출일~만기일 개월수 차이(일자 보정 포함). 날짜가 없거나 역전되면 0. */
function diffInMonths(loanDate?: string, maturityDate?: string): number {
  const start = parseDateOnly(loanDate);
  const end = parseDateOnly(maturityDate);
  if (!start || !end) return 0;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * 상세 채무 항목 1건의 기간(대출일~만기일 개월수)·월불입·총이자·총상환을 상환방식별 표준
 * 금융공식으로 계산한다(2026-08-04 결정 — 백엔드 재계산 API가 없어 클라이언트 계산값을 그대로
 * 제출/표시한다). 금리(interestRate)는 연이율(%) 기준.
 * - 원리금균등: 연금(PMT) 공식, 월불입이 매월 동일
 * - 원금균등: 매월 원금은 동일하지만 이자는 잔액에 따라 줄어 월불입도 매달 줄어든다.
 *   단일 "월불입" 칸에는 이자가 가장 큰 첫 회차(잔액 = 원금 전액) 기준 값을 표시한다
 * - 만기일시: 만기에 원금+이자를 한 번에 상환 — 월중 정기 납입이 없어 월불입 0
 * - 이자만납입: 매월 이자만 납입, 원금은 만기에 별도 상환
 */
export function calculateDebtItemAmortization(item: {
  principalWon: number;
  interestRate: number;
  repaymentMethod: AnalysisRepaymentMethod;
  loanDate?: string;
  maturityDate?: string;
}): Pick<AnalysisDebtItem, "termMonths" | "monthlyPaymentWon" | "totalInterestWon" | "totalRepaymentWon"> {
  const termMonths = diffInMonths(item.loanDate, item.maturityDate);
  const principal = item.principalWon;
  const monthlyRate = item.interestRate / 100 / 12;

  if (termMonths <= 0 || principal <= 0) {
    return {
      termMonths,
      monthlyPaymentWon: 0,
      totalInterestWon: 0,
      totalRepaymentWon: principal > 0 ? principal : 0,
    };
  }

  switch (item.repaymentMethod) {
    case "equal_principal_and_interest": {
      const monthlyPaymentWon =
        monthlyRate === 0
          ? Math.round(principal / termMonths)
          : Math.round(
              (principal * monthlyRate * (1 + monthlyRate) ** termMonths) /
                ((1 + monthlyRate) ** termMonths - 1)
            );
      const totalRepaymentWon = monthlyPaymentWon * termMonths;
      return {
        termMonths,
        monthlyPaymentWon,
        totalInterestWon: totalRepaymentWon - principal,
        totalRepaymentWon,
      };
    }
    case "equal_principal": {
      const monthlyPrincipal = principal / termMonths;
      // 매월 잔액 합 = principal * (n+1) / 2 (등차수열 합) → 총이자 = 잔액합 * 월이자율
      const totalInterestWon = Math.round(monthlyRate * principal * ((termMonths + 1) / 2));
      const monthlyPaymentWon = Math.round(monthlyPrincipal + principal * monthlyRate);
      return { termMonths, monthlyPaymentWon, totalInterestWon, totalRepaymentWon: principal + totalInterestWon };
    }
    case "bullet_payment": {
      const totalInterestWon = Math.round(principal * monthlyRate * termMonths);
      return { termMonths, monthlyPaymentWon: 0, totalInterestWon, totalRepaymentWon: principal + totalInterestWon };
    }
    case "interest_only": {
      const monthlyPaymentWon = Math.round(principal * monthlyRate);
      const totalInterestWon = monthlyPaymentWon * termMonths;
      return { termMonths, monthlyPaymentWon, totalInterestWon, totalRepaymentWon: principal + totalInterestWon };
    }
  }
}

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

// 간편모드 폼 상태 → debtBreakdown(만원). 실 API는 "해당 없는 항목은 0 또는 생략"이라 안내하지만,
// 채무종류를 하나도 선택하지 않으면 빈 객체({})가 그대로 나가는 사례가 있어 항목별로 0을 채워 보낸다.
function buildDebtBreakdown(form: DiagnosisFormState): AnalysisDebtBreakdown {
  const debtBreakdown: AnalysisDebtBreakdown = {
    bankLoan: 0,
    cardDebt: 0,
    capitalLoan: 0,
    privateDebt: 0,
    personalBorrowing: 0,
  };
  form.debtTypes.forEach((type) => {
    const key = DEBT_TYPE_TO_BREAKDOWN_KEY[type];
    debtBreakdown[key] = (debtBreakdown[key] ?? 0) + (form.debtAmounts[type] ?? 0);
  });
  return debtBreakdown;
}

// 실 API가 요구하는 필수값 중 폼에서 null일 수 있는 항목이 채워졌다는 전제 하에 호출한다.
// (호출 전 반드시 validateDiagnosisForm의 getMissingRequiredFieldLabels로 검증)
// 생성(POST /v1/analysis)과 재분석(PATCH /v1/analysis/{id}/input)이 동일한 입력 형태를
// 쓰므로 공통 매핑만 여기서 만들고, projectId/customerId 등 나머지는 호출부에서 붙인다.
function toAnalysisFormInput(form: DiagnosisFormState): AnalysisFormInput {
  const isDetailed = form.debtInputMode === "detailed";
  const debtBreakdown = buildDebtBreakdown(form);

  // 부동산 미보유 시에도 동일한 이유로 명시적으로 0을 채워 보낸다.
  const realEstateBreakdown: AnalysisRealEstateBreakdown = {
    ownedValue: 0,
    jeonseDeposit: 0,
    rentalValue: 0,
  };
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
    // 상세모드에서는 debts가 원본이고 debtBreakdown/overdueMonths는 서버가 자동 집계한다.
    // 굳이 같이 보내면 두 값이 어긋났을 때 어느 쪽이 진실인지 모호해지므로 보내지 않는다.
    ...(isDetailed
      ? { debtInputMode: "detailed" as const, debts: form.debts }
      : {
          debtInputMode: "simple" as const,
          debtBreakdown,
          overdueMonths: form.overdueMonths ?? 0,
        }),
    collateralDebt: form.securedDebt,
    debtIncurredLast3Months: form.recentDebtWithin3Months,
    debtIncurredLast1Year: form.recentDebtWithin1Year,
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
    // 채권자 수는 화면에 입력 UI가 없다 — 간편모드는 선택된 채무종류 배지 개수, 상세모드는
    // 채무 항목 테이블 행 개수를 제출 시점에 여기서만 계산해서 보낸다.
    creditorCount: isDetailed ? form.debts.length : form.debtTypes.length,
    hasTaxArrears: form.hasTaxArrears,
    hasRecentAssetDisposal: form.hasRecentAssetDisposal,
    isOperatingBusiness: form.isOperatingBusiness,
    // 새출발기금 상세 4종은 사업 영위 이력이 없으면 의미가 없어 아예 보내지 않는다(값은
    // 폼 상태에 남겨둬 토글을 다시 켰을 때 입력값이 사라지지 않게 한다).
    ...(form.isOperatingBusiness
      ? {
          businessOperationStatus: form.businessOperationStatus ?? undefined,
          freshStartFundInsolvencyReasons: form.freshStartFundInsolvencyReasons,
          isExcludedIndustryForFreshStartFund: form.isExcludedIndustryForFreshStartFund,
          hasPreviousFreshStartFundApplication: form.hasPreviousFreshStartFundApplication,
        }
      : {}),
    specialEligibilities: form.specialEligibility.map((item) => SPECIAL_ELIGIBILITY_TO_ANALYSIS[item]),
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
// 결과 화면 채무 상세 모달에서도 동일 변환을 쓰므로 export한다.
export function fromAnalysisFormInput(input: AnalysisInputData): DiagnosisFormState {
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
    isOperatingBusiness: input.isOperatingBusiness ?? false,
    debtInputMode: input.debtInputMode ?? "simple",
    debtTypes,
    debtAmounts,
    debts: input.debts ?? [],
    // 서버는 모드와 무관하게 항상 숫자로 내려준다. 구 데이터(버킷 enum으로 저장된 건)에서
    // 값이 비어 올 가능성에 대비해 0으로 폴백한다.
    overdueMonths: input.overdueMonths ?? 0,
    debtCauses: input.debtCauses.map((cause) => DEBT_CAUSE_FROM_ANALYSIS[cause]),
    hasTaxArrears: input.hasTaxArrears ?? false,
    securedDebt: input.collateralDebt ?? 0,
    recentDebtWithin3Months: input.debtIncurredLast3Months ?? 0,
    recentDebtWithin1Year: input.debtIncurredLast1Year ?? 0,
    monthlyIncome: MONTHLY_INCOME_FROM_ANALYSIS[input.monthlyIncomeRange] ?? null,
    housingType: input.housingType,
    expenses: {
      housing: input.fixedExpenses.housingCost ?? 0,
      food: input.fixedExpenses.foodCost ?? 0,
      education: input.fixedExpenses.educationCost ?? 0,
      transportation: input.fixedExpenses.transportCost ?? 0,
      other: input.fixedExpenses.otherFixedCost ?? 0,
    },
    businessOperationStatus: input.businessOperationStatus ?? null,
    freshStartFundInsolvencyReasons: input.freshStartFundInsolvencyReasons ?? [],
    isExcludedIndustryForFreshStartFund: input.isExcludedIndustryForFreshStartFund ?? false,
    hasPreviousFreshStartFundApplication: input.hasPreviousFreshStartFundApplication ?? false,
    hasPreviousApplication: input.hasPreviousBankruptcy,
    previousApplicationDetail: input.previousBankruptcyNote ?? "",
    hasGuarantor: input.hasGuarantorRelation,
    guarantorDetail: input.guarantorNote ?? "",
    hasOngoingLitigation: input.hasActiveLawsuit,
    litigationDetail: input.lawsuitNote ?? "",
    specialEligibility: (input.specialEligibilities ?? []).map(
      (item) => SPECIAL_ELIGIBILITY_FROM_ANALYSIS[item]
    ),
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
    occupation: item.employmentType ?? undefined,
    region: item.region,
    totalDebtManwon: item.totalDebt,
    monthlyAvailableIncomeManwon: item.disposableIncome,
    status: item.status,
    recommendedProcedure: item.procedure ? normalizeProcedureType(item.procedure) : undefined,
    feePlanSummary: item.feePlan,
    // 아직 절차 추적을 시작하지 않아 null이면 1단계로 표시
    progressStep: item.currentProcedureStep ?? 1,
    isShared: item.isShared,
    deliveryStatus: item.deliveryStatus ?? null,
    lawyerProjectId: item.lawyerProjectId ?? null,
    lawyerProjectName: item.lawyerProjectName ?? null,
    partnerId: item.partnerId ?? null,
    isCustomerConnected: item.isCustomerConnected,
    consultedAt: item.createdAt.slice(0, 10),
    assigneeName: assigneeName || undefined,
    assigneeProfileImageUrl: assigneeProfileImageUrl || undefined,
    assigneeProjectName: item.sourceProjectName ?? undefined,
    rejectionReason: item.rejectionReason ?? null,
  };
}

// 절차별 점수 → 등급. 실 API에 등급 필드가 없어 클라이언트에서 임계값으로 판정한다.
// SectionProcedureScores.tsx가 신용회복 그룹의 대표점수(하위 절차 중 최고점)에도
// 동일 기준을 적용하기 위해 export한다 — 임계값을 바꾸려면 여기 한 곳만 고치면 된다.
export function scoreToGrade(score: number): ProcedureGrade {
  if (score >= 70) return "good";
  if (score >= 40) return "normal";
  return "low";
}

// 연체기간은 2026-08-04 스펙부터 정확한 개월 수(정수)로 내려와 근사가 필요 없다.

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

const BREAKDOWN_LABEL: Record<keyof AnalysisDebtBreakdown, string> = {
  bankLoan: "은행대출",
  cardDebt: "카드론",
  capitalLoan: "캐피탈/저축은행",
  privateDebt: "대부업체",
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
): Partial<Record<RecommendedProcedure, ConditionItem[]>> {
  const result: Partial<Record<RecommendedProcedure, ConditionItem[]>> = {};
  for (const [procedure, condition] of procedureEntries(conditions)) {
    result[procedure] = buildConditionAnalysis(condition);
  }
  return result;
}

// 응답에 포함된 절차만 카드로 만든다 — 자격 게이트를 통과하지 못한 절차(사업 미영위 시
// 새출발기금)는 키 자체가 없다. 절차가 6종으로 늘어 순서는 추천 절차 우선 + 점수 내림차순으로 잡는다.
function buildProcedureScores(
  scores: AnalysisScores,
  recommendation: AnalysisProcedureType
): ProcedureScore[] {
  return procedureEntries(scores)
    .map(([procedure, score]) => ({
      procedure,
      label: RECOMMENDED_PROCEDURE_LABEL[procedure],
      score,
      grade: scoreToGrade(score),
      recommended: procedure === recommendation,
    }))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || b.score - a.score);
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
  // null이면(아직 추적 시작 전) 0으로 — 어떤 단계도 "진행중"으로 표시하지 않는 센티널 값.
  const currentIndex =
    currentProcedureStep != null
      ? guide.steps.findIndex((step) => step.stepId === currentProcedureStep)
      : -1;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;

  const remainingWeeks = guide.steps
    .slice(Math.max(currentStep - 1, 0))
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

function toRepaymentPlan(repayment: AnalysisExpectedRepayment): RepaymentPlan {
  // 금액은 모두 만원 단위로 내려온다(2026-07-20 실 응답 확인: monthlyPayment 125 ×
  // periodMonths 40 = totalPayment 5000, totalDebt와 동일 스케일).
  return {
    monthlyPaymentManwon: repayment.monthlyPayment,
    months: repayment.periodMonths,
    years: Math.round((repayment.periodMonths / 12) * 10) / 10,
    totalPaymentManwon: repayment.totalPayment,
    exemptedDebtManwon: repayment.expectedExemption,
    exemptedDebtWithInterestManwon: repayment.expectedExemptionWithInterest,
  };
}

// "절차별 성공 가능성"에서 선택한 절차에 따라 예상 변제 계획 내용이 통째로 바뀌어야 해서
// (SectionRepaymentPlan.tsx) 추적/추천 절차 하나만 고르지 않고 응답에 있는 모든 절차를
// 맵으로 만들어 둔다. 신속채무조정·프리워크아웃은 값이 항상 null이라 애초에 결과 맵에
// 키가 생기지 않는다 — procedureEntries가 null을 걸러내므로 별도 처리가 필요 없다.
//
// ⚠️ 2026-08-04 스펙 배포 전(~2026-07-24)에 생성된 기존 분석 건은 expectedRepayment가
// 절차별 맵이 아니라 단일 AnalysisExpectedRepayment 객체 그대로다 — 당시엔 절차가 2종뿐이라
// "추천 절차 하나에 대한 변제계획"만 있으면 충분했기 때문(2026-08-07 실 데이터로 확인,
// analysisId 63). monthlyPayment가 최상위에 직접 있으면 이 구 형태로 판단해 recommendation
// 절차 값으로 감싸 새 맵 형태와 통일한다.
function buildRepaymentPlanByProcedure(
  expectedRepayment: AnalysisExpectedRepaymentMap | AnalysisExpectedRepayment | undefined,
  recommendedProcedure: AnalysisProcedureType
): Partial<Record<RecommendedProcedure, RepaymentPlan>> {
  if (!expectedRepayment) return {};
  if (typeof (expectedRepayment as AnalysisExpectedRepayment).monthlyPayment === "number") {
    return { [recommendedProcedure]: toRepaymentPlan(expectedRepayment as AnalysisExpectedRepayment) };
  }
  const result: Partial<Record<RecommendedProcedure, RepaymentPlan>> = {};
  for (const [procedure, repayment] of procedureEntries(
    expectedRepayment as AnalysisExpectedRepaymentMap
  )) {
    result[procedure] = toRepaymentPlan(repayment);
  }
  return result;
}

const EMPTY_PROCEDURE_GUIDE: ProcedureGuide = {
  procedureLabel: "",
  totalSteps: 0,
  currentStep: 0,
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

    const statusDistribution: Record<AnalysisStatus, number> = {
      consulting: 0,
      reviewing: 0,
      rejected: 0,
      contract_pending: 0,
      in_progress: 0,
      suspended: 0,
    };
    for (const item of data.statusDistribution ?? []) {
      statusDistribution[item.status] = item.count;
    }

    const progressStepsByProcedure: Partial<
      Record<RecommendedProcedure, { step: number; title?: string; count: number }[]>
    > = {};
    for (const procedure of data.stepProgressByProcedure ?? []) {
      // 레거시 채무조정 데이터가 여전히 집계에 섞여 내려오면(방어 코드) 개인회생 그룹에 합산한다
      // — stepId가 겹치면 건수를 더하고, 새 stepId면 추가한다.
      const key = normalizeProcedureType(procedure.procedure);
      const merged = new Map((progressStepsByProcedure[key] ?? []).map((item) => [item.step, { ...item }]));
      for (const step of procedure.steps ?? []) {
        const existing = merged.get(step.stepId);
        if (existing) {
          existing.count += step.count;
        } else {
          merged.set(step.stepId, { step: step.stepId, title: step.title, count: step.count });
        }
      }
      progressStepsByProcedure[key] = Array.from(merged.values()).sort((a, b) => a.step - b.step);
    }

    return {
      totalAnalysisCount: data.totalCount,
      thisMonthCount: data.monthlyCount,
      monthlyPayment: {
        totalAmount: data.monthlyPayment?.totalAmount ?? 0,
        totalCount: data.monthlyPayment?.totalCount ?? 0,
        paidAmount: data.monthlyPayment?.paidAmount ?? 0,
        paidCount: data.monthlyPayment?.paidCount ?? 0,
      },
      statusDistribution,
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
      procedure,
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

    // normalizeProcedureType: 레거시 채무조정 등 알 수 없는 값 방어 — 유효 절차가 아니면 개인회생으로 대체.
    const recommendedProcedure: AnalysisProcedureType = normalizeProcedureType(
      analysis.analysisResult?.recommendation ?? analysis.trackingProcedure ?? "individual_rehabilitation"
    );
    // 자격 게이트를 통과하지 못한 절차는 응답 맵에 키 자체가 없다 — pickProcedureValue로 안전 조회.
    const recommendedConditions = pickProcedureValue(
      analysis.analysisResult?.procedureConditions,
      recommendedProcedure
    );
    const successProbability =
      pickProcedureValue(analysis.analysisResult?.scores, recommendedProcedure) ?? 0;

    // AI 추천(recommendedProcedure)과 별개로, 실제 상담사가 추적 중인 절차. 아직 추적을 시작하지
    // 않았다면(trackingProcedure가 null) AI 추천으로 대체 표시한다.
    const trackingProcedure: AnalysisProcedureType = normalizeProcedureType(
      analysis.trackingProcedure ?? recommendedProcedure
    );

    // 공유(납품) contact를 우선 사용. 없으면 매칭된 고객 연락처를 조회한다.
    // 변호사 프로젝트에서는 원본 고객 도메인에 없을 수 있어 실패해도 무시한다.
    // isShared여도 영업점(원본)은 고객 연락처에 접근 가능하므로 공유 여부와 무관하게 조회한다.
    let phone = analysis.contact?.trim() ? analysis.contact : "";
    if (!phone && analysis.customerId != null) {
      try {
        const customerRes = await CustomersService.detail(String(analysis.customerId)).withProject(
          projectId
        );
        phone = customerRes.data?.data?.contact1 ?? "";
      } catch (error) {
        console.error("Failed to load matched customer contact:", error);
      }
    }

    // 절차안내 드롭다운 미리보기용 — 추적 중이 아닌 절차를 골라도 서버 재조회 없이 바로 보여줄 수
    // 있도록 응답에 있는 모든 절차의 가이드를 맵으로 만든다. 실제로 추적 중인 절차만 currentStep을
    // 반영하고(analysis.trackingProcedure와 일치할 때만), 나머지는 항상 진행 전(0)으로 둔다 —
    // 미리보기가 실제 진행 상황처럼 보이면 안 되기 때문.
    const procedureGuideByProcedure: Partial<Record<RecommendedProcedure, ProcedureGuide>> = {};
    for (const [procedure, rawGuide] of procedureEntries(analysis.procedureGuides)) {
      const currentStepForProcedure =
        analysis.trackingProcedure === procedure ? analysis.currentProcedureStep : null;
      procedureGuideByProcedure[procedure] = buildProcedureGuide(rawGuide, currentStepForProcedure);
    }
    const guide = procedureGuideByProcedure[trackingProcedure];
    // buildRepaymentPlanByProcedure가 구 형태(단일 객체)/신 형태(절차별 맵) 모두 처리한다.
    const repaymentPlanByProcedure = buildRepaymentPlanByProcedure(
      analysis.analysisResult?.expectedRepayment,
      recommendedProcedure
    );
    const totalDebt = inputData.totalDebt;
    // 공유(납품)받은 건 판별 — source(원본 출처) 필드로만 판단한다. deliveryStatus는 공유 연결의
    // "양쪽"(보낸 영업점 + 받은 변호사) 모두에 남아, 영업점이 자기가 공유했다 반려당한 "자기 데이터"를
    // 봐도 rejected가 찍혀 오판된다. sourceProjectName/sourceMemberName은 "받은 경우"에만 채워져
    // 받은 쪽에만 존재하므로 방향을 정확히 가른다(반려/철회된 건도 출처 정보는 남아 계속 잡힌다).
    const isReceivedShare =
      analysis.sourceProjectName != null ||
      analysis.sourceMemberName != null ||
      analysis.sourceAssignedMemberName != null;
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
      isReceivedShare,
      status: analysis.status,
      // rejectionReason 단일 필드는 최신 AnalysisResponseDto에서 제거됨 — messages(type: "reject")
      // 히스토리의 마지막 항목으로 대체됨 (types/analysis.ts AnalysisMessageDto 주석 참고).
      rejectionReason:
        analysis.messages
          ?.filter((message) => message.type === "reject")
          .at(-1)?.message ?? null,
      deliveryStatus: analysis.deliveryStatus ?? null,
      lawyerProjectId: analysis.lawyerProjectId ?? null,
      lawyerProjectName: analysis.lawyerProjectName ?? null,
      partnerId: analysis.partnerId ?? null,
      assigneeName: assigneeName || undefined,
      assigneeProfileImageUrl: assigneeProfileImageUrl || undefined,
      assigneeProjectName: analysis.sourceProjectName ?? undefined,
      recommendedProcedure,
      trackingProcedure,
      successProbability,
      recommendation: {
        title: RECOMMENDED_PROCEDURE_LABEL[recommendedProcedure],
        description: analysis.analysisResult?.consultingScripts.firstExplanation ?? "",
        tags: recommendedConditions?.satisfied ?? [],
      },
      procedureScores: analysis.analysisResult
        ? buildProcedureScores(analysis.analysisResult.scores, recommendedProcedure)
        : [],
      conditionAnalysis: recommendedConditions ? buildConditionAnalysis(recommendedConditions) : [],
      conditionAnalysisByProcedure: analysis.analysisResult
        ? buildConditionAnalysisByProcedure(analysis.analysisResult.procedureConditions)
        : {},
      debtStatus: {
        totalDebtManwon: totalDebt,
        // 간편모드 건에는 이자 데이터 자체가 없어 undefined — UI에서 항목을 숨긴다.
        // 상세→간편 전환 후에도 서버가 이전 상세입력 값을 그대로 들려줄 수 있어, debtInputMode로
        // 한 번 더 걸러 간편모드에서는 남아있는 값이 있어도 항상 무시한다.
        totalDebtWithInterestManwon:
          inputData.debtInputMode === "detailed" ? inputData.totalDebtWithInterest : undefined,
        totalAssetManwon:
          inputData.totalRealEstateValue +
          FINANCIAL_ASSET_ESTIMATE[inputData.financialAssetRange] +
          VEHICLE_VALUE_ESTIMATE[inputData.vehicleValueRange],
        monthlyAvailableIncomeManwon: inputData.disposableIncome,
        overdueMonths: inputData.overdueMonths ?? 0,
        composition: buildDebtComposition(inputData.debtBreakdown, totalDebt),
      },
      debtAdjustmentComparison: analysis.analysisResult?.debtAdjustmentComparison ?? null,
      repaymentPlanByProcedure,
      repaymentNotes: analysis.analysisResult?.precautions ?? [],
      counselMents: analysis.analysisResult
        ? [
            { category: "core", text: analysis.analysisResult.consultingScripts.keyExplanation },
            { category: "concern", text: analysis.analysisResult.consultingScripts.concernResolution },
            { category: "next", text: analysis.analysisResult.consultingScripts.nextSteps },
          ]
        : [],
      // 실 API에 대응 필드 없음 — AI 생성 추천 질문 기능은 추후 재검토.
      aiSuggestedQuestions: [],
      // analysis.trackingProcedure가 null이면(아직 추적 시작 전) currentProcedureStep이 남아있어도
      // 무시한다 — trackingProcedureCode는 이 경우 AI 추천으로 대체 표시되는 값이라, 그 값의 단계를
      // "진행중"으로 표시하면 실제로 추적 중인 절차가 없는데도 있는 것처럼 보이게 된다.
      // (procedureGuideByProcedure 빌드 시 이미 반영됨 — 위 루프 참고)
      procedureGuide: guide ?? EMPTY_PROCEDURE_GUIDE,
      procedureGuideByProcedure,
      procedureStepHistory: (analysis.procedureStepHistory ?? []).map((item) => ({
        stepId: item.stepId,
        changedByMemberName: item.changedByMemberName,
        changedByProjectName: item.changedByProjectName ?? null,
        changedAt: item.changedAt,
      })),
      inputData,
      contact: analysis.contact ?? null,
      referenceNote: analysis.referenceNote ?? null,
      messages: (analysis.messages ?? []).map((item) => ({
        type: item.type,
        memberName: item.memberName,
        projectId: item.projectId,
        projectName: item.projectName ?? null,
        message: item.message ?? null,
        createdAt: item.createdAt,
      })),
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
      trackingProcedure: input.trackingProcedure,
      currentProcedureStep: input.currentProcedureStep,
    });
  },

  // 공유받은 분석 건 수락 (변호사 프로젝트). 검토중 상태의 건만 가능 — 성공 시 계약대기중으로 전환.
  async acceptSharedAnalysis(projectId: string, id: string, message?: string): Promise<void> {
    await AnalysisService.accept(Number(id), { projectId, ...(message ? { message } : {}) });
  },

  // 공유받은 분석 건 반려 (변호사 프로젝트). 검토중 상태의 건만 가능 — 성공 시 반려됨으로 전환.
  async rejectSharedAnalysis(projectId: string, id: string, message?: string): Promise<void> {
    await AnalysisService.reject(Number(id), { projectId, ...(message ? { message } : {}) });
  },

  // 편집(정보 수정) 진입 시 폼에 채울 원본 입력값 조회.
  async getDiagnosisForm(
    projectId: string,
    id: string
  ): Promise<{
    form: DiagnosisFormState;
    customerId: number | null;
    status: AnalysisStatus;
    isReceivedShare: boolean;
  }> {
    const response = await AnalysisService.detail(Number(id), projectId);
    const detail = response.data.data;
    return {
      form: fromAnalysisFormInput(detail.inputData),
      customerId: detail.customerId,
      status: detail.status,
      // 공유(납품)받은 건은 자체 소유가 아니므로 편집(재분석) 대상이 아니다 — 반려 상태로 status 게이트를
      // 통과하더라도 URL 직접 진입까지 막기 위해 함께 내려준다. deliveryStatus는 공유 양쪽(영업점/변호사)
      // 모두에 남아 방향 판별이 안 되므로, 받은 쪽에만 존재하는 source 필드로만 판단한다(매핑부 주석 참고).
      isReceivedShare:
        detail.sourceProjectName != null ||
        detail.sourceMemberName != null ||
        detail.sourceAssignedMemberName != null,
    };
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

  // 결과 화면에서 채무 정보만 수정 (PATCH /v1/analysis/{id}/debts). 허용 상태는 재진단과 동일해
  // canEditDiagnosisInfo를 그대로 재사용하면 된다.
  // ⚠️ reanalyze=true는 되돌릴 수 없다 — 상태 초기화 + AI 채팅 이력 삭제 + 절차 추적 초기화.
  // 호출부에서 반드시 확인 모달을 거칠 것.
  async updateDiagnosisDebts(
    projectId: string,
    id: string,
    form: DiagnosisFormState,
    reanalyze: boolean
  ): Promise<void> {
    const isDetailed = form.debtInputMode === "detailed";
    await AnalysisService.updateDebts(Number(id), {
      projectId,
      ...(isDetailed
        ? { debtInputMode: "detailed" as const, debts: form.debts }
        : {
            debtInputMode: "simple" as const,
            debtBreakdown: buildDebtBreakdown(form),
            overdueMonths: form.overdueMonths ?? 0,
          }),
      collateralDebt: form.securedDebt,
      debtIncurredLast3Months: form.recentDebtWithin3Months,
      debtIncurredLast1Year: form.recentDebtWithin1Year,
      debtCauses: form.debtCauses.map((cause) => DEBT_CAUSE_TO_ANALYSIS[cause]),
      reanalyze,
    });
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
