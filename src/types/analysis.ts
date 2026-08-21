import type { ApiSuccess } from "@/types/common";
import type { SenderNumberType, SmsAdvertisementType } from "@/types/sms";
import type { FeePlan, FeePlanSummary } from "@/types/analysisFeePlan";

// Analysis(채무 정리 AI 진단) 도메인 타입
// Swagger 스펙(POST/GET/PATCH/DELETE /v1/analysis 등) 기준.
// src/types/debtRelief.ts의 RecommendedProcedure는 이 파일의 AnalysisProcedureType 별칭이다
// (2026-08-04 일원화) — 절차 코드는 도메인/API 구분 없이 같은 값을 그대로 쓴다.

export type AnalysisStatus =
  | "consulting"
  | "reviewing"
  | "rejected"
  | "contract_pending"
  | "in_progress"
  | "suspended";

// 2026-08-04 스펙 확장: 새출발기금·신용회복 3종이 추가되어 2종 → 6종.
// fresh_start_fund(새출발기금)는 자격 게이트가 있어 inputData.isOperatingBusiness가 true인
// 케이스에서만 후보에 포함된다 — 응답의 scores/procedureConditions 등에 키 자체가 없을 수 있다.
export type AnalysisProcedureType =
  | "individual_rehabilitation"
  | "bankruptcy"
  | "fresh_start_fund"
  | "speedy_debt_adjustment"
  | "pre_workout"
  | "personal_workout";

// 절차를 반복 렌더링/순회할 때 쓰는 표시 순서 단일 소스.
export const ANALYSIS_PROCEDURE_ORDER: readonly AnalysisProcedureType[] = [
  "individual_rehabilitation",
  "bankruptcy",
  "fresh_start_fund",
  "speedy_debt_adjustment",
  "pre_workout",
  "personal_workout",
];

const ANALYSIS_PROCEDURE_SET = new Set<string>(ANALYSIS_PROCEDURE_ORDER);

export function isAnalysisProcedureType(value: unknown): value is AnalysisProcedureType {
  return typeof value === "string" && ANALYSIS_PROCEDURE_SET.has(value);
}

// 채무조정 절차가 스키마·enum에서 완전히 제거됨(2026-07-24, 백엔드 이건하). 기존에 생성된 분석 건 중
// 일부는 DB에 trackingProcedure/recommendation 등이 여전히 레거시 값("debt_adjustment")으로 남아있을
// 수 있어, 이 값이 그대로 화면에 흘러들어와 라벨 조회가 undefined가 되는 걸 막기 위한 방어 코드.
// ⚠️ 유효한 절차 값은 그대로 통과시켜야 한다 — 예전 구현처럼 "bankruptcy가 아니면 개인회생"으로
// 판정하면 6종으로 늘어난 신규 절차가 전부 개인회생으로 뭉개진다.
export function normalizeProcedureType(
  value: AnalysisProcedureType | string | null | undefined
): AnalysisProcedureType {
  return isAnalysisProcedureType(value) ? value : "individual_rehabilitation";
}

export type AnalysisGender = "male" | "female";

export type AnalysisHousingType =
  | "owned"
  | "jeonse"
  | "monthly_rent"
  | "living_with_family";

// 2026-08-06 스펙 확장: investment_loss(투자손실)를 대체하는 gambling_or_speculative_investment_loss
// (도박/주식/코인) 추가. investment_loss는 하위호환을 위해 값은 유지되나 선택 UI에는 노출하지 않는다
// (src/types/debtRelief.ts의 DEBT_CAUSE_OPTIONS/DEBT_CAUSE_LABELS 참고).
export type AnalysisDebtCause =
  | "business_failure"
  | "living_expenses"
  | "medical_expenses"
  | "investment_loss"
  | "gambling_or_speculative_investment_loss"
  | "guarantee_damage"
  | "other";

// 2026-07-10 스펙 갱신: 단일 카테고리(realEstateType)에서 항목별 시가 breakdown으로 교체됨.
// debtBreakdown과 동일 패턴 — 중복 보유 가능, 미보유 항목은 0 또는 생략.
export type AnalysisRealEstateBreakdown = {
  ownedValue?: number; // 자가 소유 부동산 시가 (만원)
  jeonseDeposit?: number; // 전세 보증금 (만원)
  rentalValue?: number; // 임대 수익용 부동산 시가 (만원)
};

export type AnalysisAssetCategory =
  | "house"
  | "land"
  | "jeonse_deposit"
  | "vehicle"
  | "financial_asset";

export type AnalysisAsset = {
  id: string;
  category: AnalysisAssetCategory;
  marketValue: number;
  description?: string;
};

export type AnalysisDebtBreakdown = {
  bankLoan?: number;
  cardDebt?: number;
  capitalLoan?: number;
  privateDebt?: number;
  personalBorrowing?: number;
};

// ── 채무 입력 모드 (2026-08-04 신규) ────────────────────────
// simple: 기존과 동일하게 debtBreakdown(종류별 잔액, 만원)을 보낸다. 생략 시 기본값.
// detailed: debts(채무 건별 상세) 배열을 보내고 debtBreakdown은 서버가 자동 집계한다.
export type AnalysisDebtInputMode = "simple" | "detailed";

// debtBreakdown의 5개 슬롯과 1:1 대응한다(저축은행 전용 슬롯은 없음 — capital_loan에 통합).
export type AnalysisDebtItemType =
  | "bank_loan"
  | "card_debt"
  | "capital_loan"
  | "private_debt"
  | "personal_borrowing";

export type AnalysisRepaymentMethod =
  | "equal_principal_and_interest"
  | "equal_principal"
  | "bullet_payment"
  | "interest_only";

// ⚠️ 금액 필드(*Won)만 원 단위다 — 이 도메인의 다른 모든 금액은 만원 단위라 혼동 주의.
export type AnalysisDebtItem = {
  /** 프론트에서 생성한 임의 ID (수정 시 항목 식별용) */
  id: string;
  debtType: AnalysisDebtItemType;
  /** 연결된 담보 자산 ID. 무담보 채무는 생략한다. */
  collateralAssetId?: string;
  creditorName: string;
  repaymentMethod?: AnalysisRepaymentMethod;
  overdueMonths: number;
  /** YYYY-MM-DD */
  loanDate?: string;
  /** YYYY-MM-DD */
  maturityDate?: string;
  currentBalanceWon: number;
  /** % (소수점 가능) */
  interestRate?: number;
  remainingMonths?: number;
  monthlyPaymentWon?: number;
  remainingInterestWon?: number;
  totalRepaymentWon?: number;
  /** true면 채무는 저장하되 총채무·청산가치·면책액·AI 진단 계산에서 제외한다. */
  isExcludedFromAnalysis?: boolean;
};

/** 상세모드로 입력된 건에만 응답에 포함되는 서버 계산값 */
export type AnalysisDebtDerivedSignals = {
  maxOverdueMonths: number;
  weightedAverageInterestRate: number;
  /** ⚠️ 단위(0~1 비율 vs 0~100 퍼센트) 백엔드 확인 전 — 화면 표시 시 반드시 확인할 것 */
  highInterestDebtRatio: number;
  remainingInterestWon: number;
};

export type AnalysisCollateralBreakdown = {
  assetDetails: Array<{
    category: AnalysisAssetCategory;
    description?: string | null;
    marketValue: number;
    collateralDebt: number;
    securedRecoverable: number;
    netValue: number;
  }>;
  totalAssetValue: number;
  liquidationValue: number;
  collateralDebt: number;
  securedRecoverableDebt: number;
  securedShortfallDebt: number;
  unsecuredDebt: number;
  dischargeableDebt: number;
  unpairedCollateralDebt: number;
  pairingSource: "paired" | "estimated";
};

// 2026-07-24 스펙 갱신: 개인회생 변제기간 단축 특례 대상(중복 선택 가능, 없으면 빈 배열).
export type AnalysisSpecialEligibility =
  | "under_29"
  | "over_65"
  | "severe_disability"
  | "jeonse_fraud_victim";

// 2026-08-05 스펙 추가: 새출발기금 상세 항목. isOperatingBusiness가 true일 때만 의미있는 optional
// 필드들 — 백엔드가 isExcludedIndustryForFreshStartFund/hasPreviousFreshStartFundApplication 중
// 하나라도 true면 새출발기금을 결과 후보에서 자동 제외한다(프론트 별도 경고 불필요).
export type AnalysisBusinessOperationStatus =
  | "operating"
  | "suspended"
  | "closed_individual"
  | "closed_corporate";

export type AnalysisFreshStartFundInsolvencyReason =
  | "overdue_3_months"
  | "maturity_extension_or_payment_deferral"
  | "tax_arrears"
  | "low_credit_score"
  | "not_applicable";

// ============================================
// 분석 생성/수정 입력
// ============================================

export type AnalysisFormInput = {
  customerName: string;
  gender: AnalysisGender;
  ageGroup: string;
  region: string;
  employmentType: string;
  dependents: number;
  hasSpouseIncome: boolean;
  /** 만원 단위 실제 세후 실수령액. 소득 없으면 0(2026-08-07 스펙 — 구간 선택 폐지) */
  monthlyIncome: number;
  housingType: AnalysisHousingType;
  /** 법원 인정 최저생계비를 넘어서 추가로 인정받아야 할 금액(만원). 일반 식비·교통비 등은
   * 최저생계비 개념에 이미 포함되어 더 이상 받지 않는다(2026-08-07 스펙 — fixedExpenses 폐지).
   * 해당 없으면 0. */
  additionalFixedExpense: number;
  /** 생략 시 서버 기본값 "simple" */
  debtInputMode?: AnalysisDebtInputMode;
  /** 두 모드 모두 필수. simple은 상환 조건 필드를 생략할 수 있다. */
  debts: AnalysisDebtItem[];
  debtCauses: AnalysisDebtCause[];
  assets: AnalysisAsset[];
  hasPreviousBankruptcy: boolean;
  previousBankruptcyNote?: string;
  hasGuarantorRelation: boolean;
  guarantorNote?: string;
  hasActiveLawsuit: boolean;
  lawsuitNote?: string;
  hasTaxArrears?: boolean;
  hasRecentAssetDisposal?: boolean;
  /** 사업 영위 여부(현재 또는 과거). 새출발기금 후보 게이트 — 필수값이라 누락 시 400 */
  isOperatingBusiness: boolean;
  /** isOperatingBusiness가 true일 때만 의미있는 optional 필드 4종 */
  businessOperationStatus?: AnalysisBusinessOperationStatus;
  freshStartFundInsolvencyReasons?: AnalysisFreshStartFundInsolvencyReason[];
  isExcludedIndustryForFreshStartFund?: boolean;
  hasPreviousFreshStartFundApplication?: boolean;
  specialEligibilities: AnalysisSpecialEligibility[]; // 없으면 []
  additionalNotes?: string;
};

export type CreateAnalysisInput = AnalysisFormInput & {
  projectId: string;
  customerId?: number; // 기존 고객과 바로 매칭
};

export type UpdateAnalysisInput = {
  projectId: string;
  trackingProcedure?: AnalysisProcedureType;
  currentProcedureStep?: number;
};

/** POST /v1/analysis/{id}/self-progress — 영업점의 상담중/반려됨 분석을 자체 진행 */
export type SelfProgressAnalysisInput = {
  projectId: string;
  message?: string;
};

// PATCH /v1/analysis/{id}/input — 입력값 수정 + AI 재진단. customerId는 없음(고객 매칭은
// matchCustomer/unmatchCustomer로 별도 처리). 성공 시 status/trackingProcedure/
// currentProcedureStep이 초기화되고 AI 채팅 이력이 삭제된다 — 호출 전 UI에서 확인 필요.
export type ReanalyzeAnalysisInput = AnalysisFormInput & {
  projectId: string;
};

// PATCH /v1/analysis/{id}/debts — 결과 화면에서 채무 정보만 수정.
// 허용 상태는 재진단(PATCH /{id}/input)과 동일(상담중/반려됨, 변호사 프로젝트는 계약대기중 포함).
// debtInputMode만 바꿔 보내면 간편↔상세 모드 전환도 된다.
export type UpdateAnalysisDebtsInput = {
  projectId: string;
  debtInputMode: AnalysisDebtInputMode;
  debts: AnalysisDebtItem[];
  assets: AnalysisAsset[];
  debtCauses: AnalysisDebtCause[];
  /** true면 저장 후 AI 재진단까지 수행한다 — 상태 초기화 + 채팅 이력 삭제 + 절차 추적 초기화라
   * 되돌릴 수 없다. 호출 전 확인 모달 필수. false면 채무 값만 갱신되고 나머지는 유지된다. */
  reanalyze: boolean;
};

export type UpdateAnalysisDebtsResponse = ApiSuccess<AnalysisDetail>;

// ============================================
// 분석 상세/결과
// ============================================

// 서버가 입력값으로부터 계산해 채워주는 필드 포함.
// debtInputMode/overdueMonths/debtBreakdown/totalDebt는 입력 모드와 무관하게 항상 채워져 내려온다
// (상세모드도 서버가 debts로부터 자동 집계) — 요청에서는 optional이라 여기서 필수로 좁힌다.
//
// ⚠️ 2026-08-07 스펙(monthlyIncome/additionalFixedExpense/financialAssetValue/vehicleValue) 배포
// 시점에 DB 마이그레이션 비용 문제로 기존(레거시) 분석 건은 백필되지 않기로 확정됨(2026-08-07
// 사용자 확인) — 신규 생성 건은 항상 채워지지만, 그 이전에 생성된 건은 이 네 필드가 응답에서
// 아예 빠질 수 있다. AnalysisFormInput은 "우리가 보내는 값"이라 항상 필수지만, 여기 응답
// 타입에서는 이 네 필드만 optional로 좁혀 호출부가 컴파일 타임에 폴백(`?? 0`)을 빠뜨리지
// 않도록 강제한다(services/debtRelief.ts의 fromAnalysisFormInput·getDiagnosisDetail 참고).
export type AnalysisInputData = Omit<
  AnalysisFormInput,
  "monthlyIncome" | "additionalFixedExpense" | "assets" | "debts"
> & {
  monthlyIncome?: number;
  additionalFixedExpense?: number;
  assets: AnalysisAsset[];
  debts: AnalysisDebtItem[];
  // 필드명·타입은 그대로지만 계산 방식이 바뀌었다(조용한 Breaking Change) — 이전 "월소득 − 실제
  // 월 고정지출 합계"(가계부 기준)에서 이후 "월소득 − 가구원수별 법원 인정 최저생계비 −
  // additionalFixedExpense"(법원 인정 기준)로 변경. estimatedMonthlyIncome/totalMonthlyExpense는
  // 서버 응답에서 사라졌다. 레거시 건은 예전 공식으로 계산된 값이 그대로 내려온다(재계산 안 됨).
  disposableIncome: number;
  totalDebt: number;
  totalRealEstateValue?: number;
  debtInputMode: AnalysisDebtInputMode;
  overdueMonths: number;
  debtBreakdown: AnalysisDebtBreakdown;
  /** 상세모드 전용 서버 계산값 */
  debtDerivedSignals?: AnalysisDebtDerivedSignals;
  /** 상세모드 전용 — 이자 포함 총채무 (만원) */
  totalDebtWithInterest?: number;
  collateralBreakdown?: AnalysisCollateralBreakdown;
  /** 구 레코드 읽기 호환 전용. 신규 요청에는 사용하지 않는다. */
  realEstateBreakdown?: AnalysisRealEstateBreakdown;
  financialAssetValue?: number;
  vehicleValue?: number;
};

export type AnalysisProcedureConditions = {
  satisfied: string[];
  needsSupplement: string[];
  riskFactors: string[];
};

// 2026-08-04 스펙 확장: 고정 2키 → 절차별 동적 맵. 신규 스펙에서는 6키가 항상 존재하되,
// 자격 게이트(새출발기금 등)를 통과하지 못한 절차는 값이 number/object가 아니라 **null**이다
// (2026-08-07 백엔드 확인 — "scores[procedure] === null 체크로 판정"). 구 스펙(~2026-07-24
// 이전 생성 건)은 반대로 키 자체가 없다(Partial 경고 참고). 두 경우를 한 번에 표현하려고
// `| null`을 더한 Partial을 쓴다 — pickProcedureValue/procedureEntries가 null도 "없음"으로
// 처리하므로 호출부는 값의 존재 여부만 optional chaining으로 다루면 된다.
export type AnalysisProcedureConditionsMap = Partial<
  Record<AnalysisProcedureType, AnalysisProcedureConditions | null>
>;

export type AnalysisScores = Partial<Record<AnalysisProcedureType, number | null>>;

// 신규 생성/재진단 응답은 절차 enum 값(스네이크케이스)을 키로 쓴다 — 2026-08-04 Swagger로 확정
// (`scores: { "individual_rehabilitation": 72, "bankruptcy": 18 }`).
// ⚠️ 그러나 이 스펙이 배포되기 전(~2026-07-24)에 생성된 기존 분석 건은 scores/procedureConditions가
// 여전히 구 camelCase 고정 2키("individualRehabilitation")로 DB에 저장돼 있다 — procedureGuides처럼
// 조회 시점에 마스터 데이터와 조인해 재계산되는 필드가 아니라 생성 당시 저장된 값을 그대로 돌려주기
// 때문에, 백엔드가 과거 데이터를 일괄 마이그레이션하지 않는 한 계속 이 형태로 남는다
// (2026-08-07 실 데이터로 확인 — analysisId 63, http://localhost:3000/debt-relief/63).
// bankruptcy는 두 표기가 동일해 문제 없고, individual_rehabilitation만 구 키로도 조회를 시도한다.
const LEGACY_PROCEDURE_KEY: Record<string, AnalysisProcedureType> = {
  individualRehabilitation: "individual_rehabilitation",
};

/** 절차별 맵에서 특정 절차의 값을 꺼낸다. 키가 없거나 값이 null이면 undefined
 * (자격 게이트 미통과, 또는 애초에 해당 절차엔 개념이 없는 필드 — 예: 신속채무조정의 변제계획). */
export function pickProcedureValue<T>(
  map: Partial<Record<AnalysisProcedureType, T | null>> | null | undefined,
  procedure: AnalysisProcedureType
): T | undefined {
  if (!map) return undefined;
  const direct = map[procedure];
  if (direct != null) return direct;
  if (procedure === "individual_rehabilitation") {
    const legacy = (map as Record<string, T | null | undefined>).individualRehabilitation;
    return legacy ?? undefined;
  }
  return undefined;
}

/** 절차별 맵을 [절차, 값] 배열로 순회. null 값과 알 수 없는 키(레거시 채무조정 등)는 버린다. */
export function procedureEntries<T>(
  map: Partial<Record<AnalysisProcedureType, T | null>> | null | undefined
): [AnalysisProcedureType, T][] {
  if (!map) return [];
  const entries: [AnalysisProcedureType, T][] = [];
  for (const [key, value] of Object.entries(map) as [string, T | null | undefined][]) {
    if (value == null) continue;
    const procedure = isAnalysisProcedureType(key) ? key : LEGACY_PROCEDURE_KEY[key];
    if (!procedure) continue;
    entries.push([procedure, value]);
  }
  return entries;
}

// 금액은 모두 만원 단위로 내려온다(2026-07-20 실응답 확인: monthlyPayment 125 ×
// periodMonths 40 = totalPayment 5000 으로 totalDebt와 동일 스케일).
export type AnalysisExpectedRepayment = {
  monthlyPayment: number;
  periodMonths: number;
  totalPayment: number;
  expectedExemption: number;
  /** 이자 포함 예상 면책 채무 (만원). 채무 상세입력(detailed) 모드로 생성된 건에만 존재 */
  expectedExemptionWithInterest?: number;
};

// ⚠️ 신속채무조정·프리워크아웃은 게이트 통과 여부와 무관하게 항상 null이다(2026-08-07 백엔드
// 확인) — 이 두 절차는 분할 변제 개념 자체가 없어 "예상 조정 요약"으로 별도 표시하고, 변제계획
// 수치는 렌더링하지 않는다(SectionRepaymentPlan.tsx 참고).
export type AnalysisExpectedRepaymentMap = Partial<
  Record<AnalysisProcedureType, AnalysisExpectedRepayment | null>
>;

export type AnalysisConsultingScripts = {
  firstExplanation: string;
  keyExplanation: string;
  concernResolution: string;
  nextSteps: string;
};

export type AnalysisResult = {
  recommendation: AnalysisProcedureType;
  scores: AnalysisScores;
  procedureConditions: AnalysisProcedureConditionsMap;
  /** 절차별 예상 변제 계획. scores와 동일하게 후보 절차만 키로 존재한다 */
  expectedRepayment: AnalysisExpectedRepaymentMap;
  precautions: string[];
  consultingScripts: AnalysisConsultingScripts;
  // 개인회생 선택 시에만 노출되는 "개인회생과 개인워크아웃 비교" 섹션 문구. 1~3문장, **강조** 마크업 포함 가능.
  debtAdjustmentComparison?: string | null;
};

export type AnalysisProcedureStepDetails = {
  desc: string;
  items: string[];
  // Swagger 예시가 빈 객체({})로 표기되어 있어 실제 타입 미확정. 문자열 힌트로 추정.
  note?: string | null;
  example?: string | null;
  caution?: string | null;
};

export type AnalysisProcedureStep = {
  stepId: number;
  title: string;
  durationLabel: string;
  durationWeeks: number;
  details: AnalysisProcedureStepDetails;
  isCurrent?: boolean; // 분석 상세 조회 시에만 포함
  isCompleted?: boolean; // 분석 상세 조회 시에만 포함
};

export type AnalysisProcedureGuide = {
  procedure: AnalysisProcedureType;
  label: string;
  color: string;
  totalMonths: string;
  steps: AnalysisProcedureStep[];
  isRecommended: boolean;
  isTracking: boolean;
  score?: number;
  currentStepId?: number | null; // 추적 중인 절차일 때만
};

// scores/procedureConditions와 동일하게 절차별 동적 맵. pickProcedureValue로 조회한다.
export type AnalysisProcedureGuidesMap = Partial<
  Record<AnalysisProcedureType, AnalysisProcedureGuide>
>;

export type AnalysisDetail = {
  id: number;
  projectId: number;
  memberId: number | null; // 담당 멤버 ID (null이면 배정대기)
  customerId: number | null; // 매칭된 고객 ID
  status: AnalysisStatus;
  trackingProcedure: AnalysisProcedureType | null;
  currentProcedureStep: number | null;
  inputData: AnalysisInputData;
  collateralBreakdown?: AnalysisCollateralBreakdown;
  analysisResult: AnalysisResult | null;
  procedureGuides: AnalysisProcedureGuidesMap | null;
  isShared: boolean; // 공유(납품)받은 분석 건 여부
  sourceProjectName: string | null; // 공유받은 경우 원본(영업) 프로젝트 이름
  sourceMemberName?: string | null;
  sourceMemberProfileImageUrl?: string | null;
  sourceAssignedMemberName?: string | null;
  sourceAssignedMemberProfileImageUrl?: string | null;
  /** 공유 시 전달한 연락처 (없으면 null) */
  contact?: string | null;
  /** 공유 시 전달한 참고사항 (없으면 null) */
  referenceNote?: string | null;
  /** 반려됨 상태인 경우 변호사 프로젝트가 남긴 반려 사유. 목록 응답(AnalysisListItem)에는 없음 — 상세 전용.
   * ⚠️ 2026-07-20 accept/reject 스펙 확인 결과 이 필드는 최신 AnalysisResponseDto에 더 이상 없음 —
   * messages(type: "reject")의 message로 대체된 것으로 보임. 실 API로 확인 전까지는 유지. */
  rejectionReason?: string | null;
  /** 절차 단계 변경 이력 (상세 응답에 포함된 최근 이력) */
  procedureStepHistory?: AnalysisProcedureStepHistoryItem[];
  /** 공유 연결 상태. delivered=공유중(수락 이후에도 연결이 유지되는 한 계속 delivered — "검토 대기"가 아님,
   * 검토 대기 여부는 status==="reviewing"으로 판단), rejected=반려됨, revoked=철회됨. 연결 없으면 null */
  deliveryStatus?: "delivered" | "revoked" | "rejected" | null;
  /** 공유 대상 변호사 프로젝트 ID (재공유 시 동일 프로젝트 제한용) */
  lawyerProjectId?: number | null;
  lawyerProjectName?: string | null;
  /** 공유 API에 사용하는 파트너 관계 ID(analysis_partner). 재공유 시 partnerId로 사용 */
  partnerId?: number | null;
  /** 공유/반려/수락/수임료 입력·수정 등 액션 메시지 히스토리 (시간순) */
  messages?: AnalysisMessageDto[];
  /** 계약대기중 이후 등록된 수임료 계획 */
  feePlan: FeePlan | null;
  createdAt: string;
  updatedAt: string;
};

/** 분석 건 액션(공유/반려/수락/수임료 입력·수정·중단·환불/절차 변경) 메시지 히스토리 항목 */
export type AnalysisMessageDto = {
  type:
    | "share"
    | "reject"
    | "accept"
    | "self_proceed"
    | "fee_create"
    | "fee_update"
    | "fee_stop"
    | "fee_refund"
    | "procedure_change";
  referenceId?: number | null;
  memberName: string;
  projectId: number;
  projectName?: string | null;
  message?: string | null;
  createdAt: string;
};

/** 절차 단계 변경 이력 항목 (상세 procedureStepHistory / GET procedure-changes) */
export type AnalysisProcedureStepHistoryItem = {
  stepId: number;
  changedByMemberId: number;
  changedByMemberName: string;
  changedByMemberProfileImageUrl?: string | null;
  changedByProjectId: number;
  /** 해당 단계로 변경한 프로젝트 이름 */
  changedByProjectName?: string | null;
  changedAt: string;
};

/**
 * GET /v1/analysis/{id}/procedure-changes
 * 최신 절차(trackingProcedure/step) 변경 1건 스냅샷.
 */
export type AnalysisProcedureChange = {
  id: number;
  trackingProcedure: AnalysisProcedureType;
  currentProcedureStep: number | null;
  previousTrackingProcedure: AnalysisProcedureType | null;
  previousCurrentProcedureStep: number | null;
  changedByMemberId: number;
  changedByMemberName: string;
  changedByMemberProfileImageUrl?: string | null;
  changedByProjectId: number;
  createdAt: string;
};

export type AnalysisProcedureChangesResponse = ApiSuccess<AnalysisProcedureChange>;

/**
 * POST /v1/analysis/{id}/send-sms
 * 공유 시 전달받은 연락처(contact)가 있으면 그걸로, 없으면 매칭된 고객 연락처로 발송한다.
 * 둘 다 없으면 실패(400 BAD_REQUEST).
 */
export type AnalysisSendSmsInput = {
  senderNumberType: SenderNumberType;
  senderNumberId: number;
  advertisementType: SmsAdvertisementType;
  /** 광고성 문자일 경우 필수 */
  serviceName?: string;
  /** LMS/MMS에서 사용 */
  title?: string;
  content: string;
  /** ISO 8601, 즉시 발송 시 현재 시간 */
  scheduledAt: string;
  imageUrls?: string[];
};

export type AnalysisSendSmsResult = {
  smsHistoryId: number;
  recipientPhoneNumber: string;
  // Swagger에 enum 미공개, 확인된 값: "contact"(공유 시 전달받은 연락처). 매칭된 고객 연락처로
  // 발송된 경우의 실제 값은 응답 확인 후 필요시 수정.
  recipientSource: string;
};

export type AnalysisSendSmsResponse = ApiSuccess<AnalysisSendSmsResult>;

export type CreateAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type AnalysisDetailResponse = ApiSuccess<AnalysisDetail>;
export type UpdateAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type SelfProgressAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type ReanalyzeAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type DeleteAnalysisResponse = ApiSuccess<Record<string, never>>;

// ============================================
// 분석 목록
// ============================================

export type AnalysisListItem = {
  id: number;
  status: AnalysisStatus;
  customerName: string;
  employmentType?: string | null;
  region: string;
  // 2026-08-08 실 응답 확인: totalDebt/disposableIncome 둘 다 타입상 number지만 특정 목록 건에서
  // null/undefined로 내려오는 경우가 있다(원인 미확인) — toDiagnosisListItem에서 반드시 0으로
  // 방어해서 도메인 타입(DiagnosisListItem)으로 넘긴다. 같은 응답의 같은 위치 필드라 동일 위험군.
  totalDebt: number | null;
  disposableIncome: number | null;
  // 백엔드가 trackingProcedure ?? analysisResult.recommendation ?? null 로 계산해 내려주는 단일 필드.
  // "절차진행중이면 현재 추적 절차, 그 이전 단계에서는 AI 추천 절차"를 항상 정확히 반영한다.
  procedure: AnalysisProcedureType | null;
  // 계약대기중 이후 입력된 경우에만 존재하는 수임료 결제정보 요약 (설치 회차 배열은 없음 — 상세는 FeePlan 참고)
  feePlan: FeePlanSummary | null;
  currentProcedureStep: number | null;
  // 고객과 연결되어 있는지 여부. 변호사 프로젝트가 공유받은 건은 항상 false.
  isCustomerConnected: boolean;
  isShared: boolean;
  sourceProjectName: string | null;
  sourceMemberName?: string | null;
  sourceMemberProfileImageUrl?: string | null;
  sourceAssignedMemberName?: string | null;
  sourceAssignedMemberProfileImageUrl?: string | null;
  // 2026-07-20 실 응답 확인 결과 목록에도 상세와 동일하게 내려옴 — 타입에 누락돼 있었음.
  // delivered=공유중(검토 대기 여부와 무관하게 연결이 살아있는 동안 유지), rejected=반려됨, revoked=철회됨.
  deliveryStatus?: "delivered" | "revoked" | "rejected" | null;
  lawyerProjectId?: number | null;
  lawyerProjectName?: string | null;
  partnerId?: number | null;
  createdAt: string;
  // 고객정보 셀 하단(나이·성별) 표시용. 백엔드가 내려주는 경우만 채운다.
  gender?: AnalysisGender | null;
  ageGroup?: string | null; // "40대" 라벨 또는 "40s" 코드
  age?: number | null;
  // 반려됨 상태일 때 마지막 반려 사유. 2026-07-20 확인 결과 목록 응답에는 아직 없음(상세의
  // messages(type: "reject")로만 확인 가능) — 백엔드가 목록에도 내려주기 시작하면 자동으로 채워짐.
  rejectionReason?: string | null;
};

export type AnalysisSortType = "consultationDate";
export type AnalysisSortOrder = "ASC" | "DESC";

export type AnalysisListQuery = {
  projectId: string;
  /** 복수 전달 가능. 미지정 시 서버가 rejected 제외. 반려 탭은 rejected 단독 전달 */
  status?: AnalysisStatus | AnalysisStatus[];
  procedure?: AnalysisProcedureType | AnalysisProcedureType[];
  search?: string;
  page?: number;
  limit?: number;
  sortType?: AnalysisSortType;
  sortOrder?: AnalysisSortOrder;
};

export type AnalysisListResponse = ApiSuccess<{
  items: AnalysisListItem[];
  total: number;
  page: number;
  limit: number;
}>;

// ============================================
// AI 채팅 (히스토리 + SSE 스트리밍)
// ============================================

export type AnalysisChatRole = "user" | "assistant";

export type AnalysisChatMessage = {
  id: number;
  analysisId: number;
  role: AnalysisChatRole;
  content: string;
  createdAt: string;
};

// ⚠️ Swagger 예시는 data가 단일 객체({id, analysisId, role, content, createdAt})로만 표기돼 있으나
// "채팅 히스토리 조회"라는 설명상 배열이 맞을 가능성이 높다. 실제 응답 확인 후 필요시 수정.
export type AnalysisChatHistoryResponse = ApiSuccess<AnalysisChatMessage[]>;

export type AnalysisChatSendInput = {
  id: number;
  projectId: string;
  message: string;
};

// SSE 이벤트 페이로드 (각 data: 라인을 JSON.parse한 결과)
export type AnalysisChatStreamEvent = { delta: string } | { done: true };

// ============================================
// 고객 매칭
// ============================================

export type ConnectableCustomer = {
  id: number;
  name: string;
  contact1: string;
  applicationDate: string;
  /** 연령대 표시 문자열. API에 있으면 사용, 없으면 "-" */
  ageRange?: string | null;
  assignedMemberName?: string | null;
  assignedTeamName?: string | null;
  assignedMember?: {
    id: number;
    name: string;
    /** GET /v1/analysis/connectable-customers(v2) 응답 — 팀 정보가 중첩 대신 평평하게 옴 */
    teamId?: number | null;
    teamName?: string | null;
    team?: { id: number; name: string } | null;
  } | null;
};

export type ConnectableCustomersQuery = {
  /** 분석 건 ID. 있으면 담당자 기준, 없으면(신규 화면) 요청 멤버 기준으로 조회됨 — GET /v1/analysis/connectable-customers 전용. */
  analysisId?: number;
  search?: string;
  page?: number;
  limit?: number;
};

export type ConnectableCustomersResponse = ApiSuccess<{
  customers: ConnectableCustomer[];
  total: number;
  page: number;
  limit: number;
}>;

export type MatchAnalysisCustomerInput = {
  projectId: string;
  customerId: number;
};

export type MatchAnalysisCustomerResponse = ApiSuccess<Record<string, never>>;
export type UnmatchAnalysisCustomerResponse = ApiSuccess<Record<string, never>>;

// ============================================
// 분석 건 공유 (영업 -> 변호사 프로젝트)
// ============================================

export type AnalysisDelivery = {
  id: number;
  analysisId: number;
  lawyerProjectId: number;
  lawyerProjectName: string;
  deliveredByMemberId: number;
  // Swagger에 enum 미공개, 확인된 값: "delivered"
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliverAnalysisInput = {
  projectId: string;
  /** AnalysisPartner.id (파트너십 레코드 id). partnerProjectId가 아님. */
  partnerId: number;
  /** 공유 시 함께 전달할 연락처 (선택) */
  contact?: string;
  /** 공유 시 함께 전달할 참고사항 (선택). 실 API 필드명은 referenceNote가 아니라 message —
   * 히스토리(messages)로 누적되는 자유 텍스트다. */
  message?: string;
};

export type DeliverAnalysisResponse = ApiSuccess<AnalysisDelivery>;

// ============================================
// 공유받은 분석 건 수락/반려 (변호사 프로젝트)
// ============================================

export type AcceptAnalysisInput = {
  projectId: string;
  /** 선택 — 히스토리(messages)로 누적됨 */
  message?: string;
};

/** 수락 성공 시 status가 contract_pending으로 바뀐 분석 상세를 그대로 반환 */
export type AcceptAnalysisResponse = ApiSuccess<AnalysisDetail>;

export type RejectAnalysisInput = {
  projectId: string;
  /** 선택 — 히스토리(messages)로 누적됨 */
  message?: string;
};

/** 반려 성공 시 status가 rejected로 바뀐 분석 상세를 그대로 반환. 접근 권한(isShared 조회)은 유지됨 */
export type RejectAnalysisResponse = ApiSuccess<AnalysisDetail>;

// ⚠️ Swagger 예시는 data가 단일 객체로 표기돼 있으나 "공유 이력 조회"이므로 배열일 가능성이 높다.
// 실제 응답 확인 후 필요시 수정.
export type AnalysisDeliveriesResponse = ApiSuccess<AnalysisDelivery[]>;

export type RevokeAnalysisDeliveryResponse = ApiSuccess<Record<string, never>>;

// ============================================
// 분석 일괄 삭제 / 일괄 공유
// ============================================

export type AnalysisBulkFilterConditions = {
  status?: AnalysisStatus;
  procedure?: AnalysisProcedureType;
  search?: string;
};

/** POST /v1/analysis/bulk-delete — 자체 생성 분석 건만 삭제 */
export type BulkDeleteAnalysisInput = {
  projectId: string;
  deleteType: "ids" | "filter";
  analysisIds?: number[];
  filterConditions?: AnalysisBulkFilterConditions;
  expectedCount?: number;
};

export type BulkDeleteAnalysisResult = {
  deletedCount: number;
  failedCount: number;
  totalCount: number;
  failedAnalysisIds: number[];
};

export type BulkDeleteAnalysisResponse = ApiSuccess<BulkDeleteAnalysisResult>;

/**
 * POST /v1/analysis/bulk-deliver — 분석 건별 공유 정보
 */
export type BulkDeliverAnalysisItem = {
  analysisId: number;
  contact?: string;
  /** 실 API 필드명은 referenceNote가 아니라 message. */
  message?: string;
};

/**
 * POST /v1/analysis/bulk-deliver
 * 활성 공유는 분석 건당 변호사 프로젝트 1곳만 허용 (단일 partnerId).
 */
export type BulkDeliverAnalysisInput = {
  projectId: string;
  selectionType: "ids" | "filter";
  analysisIds?: number[];
  filterConditions?: AnalysisBulkFilterConditions;
  expectedCount?: number;
  partnerId: number;
  /** 분석 건별 공유 정보 (연락처, 추가전달사항) — 필수 */
  deliveryItems: BulkDeliverAnalysisItem[];
};

export type BulkDeliverAnalysisResult = {
  successCount: number;
  failedCount: number;
  totalCount: number;
  failedAnalysisIds: number[];
};

export type BulkDeliverAnalysisResponse = ApiSuccess<BulkDeliverAnalysisResult>;

// ============================================
// 분석 요약 통계 (GET /v1/analysis/summary)
// ============================================

export type AnalysisMonthlyPayment = {
  totalAmount: number; // 이번 달 총 결제 금액 (면제 제외)
  totalCount: number; // 이번 달 총 결제 건수 (면제 제외)
  paidAmount: number; // 이번 달 납부 완료 금액
  paidCount: number; // 이번 달 납부 완료 건수
};

export type AnalysisStatusDistributionItem = {
  status: AnalysisStatus;
  count: number;
};

export type AnalysisStepProgressItem = {
  stepId: number;
  title: string;
  count: number;
};

export type AnalysisStepProgressByProcedure = {
  procedure: AnalysisProcedureType;
  label: string;
  steps: AnalysisStepProgressItem[];
};

export type AnalysisSummary = {
  totalCount: number;
  monthlyCount: number;
  monthlyPayment: AnalysisMonthlyPayment;
  statusDistribution: AnalysisStatusDistributionItem[];
  stepProgressByProcedure: AnalysisStepProgressByProcedure[];
};

export type AnalysisSummaryResponse = ApiSuccess<AnalysisSummary>;

// ============================================
// 절차 마스터 데이터
// ============================================

export type AnalysisProcedureMaster = {
  procedure: AnalysisProcedureType;
  label: string;
  color: string;
  totalMonths: string;
  steps: AnalysisProcedureStep[];
};

// 개인회생/파산 2개 절차의 마스터 데이터를 모두 반환하는 것으로 추정(쿼리 파라미터 없음).
// 실제 응답 확인 후 필요시 수정.
export type AnalysisProceduresResponse = ApiSuccess<AnalysisProcedureMaster[]>;
