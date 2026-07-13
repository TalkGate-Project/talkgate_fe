import type { ApiSuccess } from "@/types/common";

// Analysis(채무 정리 AI 진단) 도메인 타입
// Swagger 스펙(POST/GET/PATCH/DELETE /v1/analysis 등) 기준.
// ⚠️ src/types/debtRelief.ts의 mock 전용 RecommendedProcedure는 값이 다르다
// ("individual_rehab" vs 여기의 "individual_rehabilitation"). 실 API 연동 시 값 매핑 필요.

export type AnalysisStatus = "reviewing" | "consulting" | "in_progress";

export type AnalysisProcedureType =
  | "individual_rehabilitation"
  | "debt_adjustment"
  | "bankruptcy";

export type AnalysisGender = "male" | "female";

export type AnalysisMonthlyIncomeRange =
  | "under_100"
  | "100_to_200"
  | "200_to_300"
  | "300_to_400"
  | "over_400";

export type AnalysisHousingType =
  | "owned"
  | "jeonse"
  | "monthly_rent"
  | "living_with_family";

export type AnalysisOverduePeriod =
  | "none"
  | "under_3_months"
  | "3_to_6_months"
  | "6_to_12_months"
  | "over_1_year";

export type AnalysisDebtCause =
  | "business_failure"
  | "living_expenses"
  | "medical_expenses"
  | "investment_loss"
  | "guarantee_damage"
  | "other";

// 2026-07-10 스펙 갱신: 단일 카테고리(realEstateType)에서 항목별 시가 breakdown으로 교체됨.
// debtBreakdown과 동일 패턴 — 중복 보유 가능, 미보유 항목은 0 또는 생략.
export type AnalysisRealEstateBreakdown = {
  ownedValue?: number; // 자가 소유 부동산 시가 (만원)
  jeonseDeposit?: number; // 전세 보증금 (만원)
  rentalValue?: number; // 임대 수익용 부동산 시가 (만원)
};

export type AnalysisFinancialAssetRange =
  | "none"
  | "under_500"
  | "500_to_2000"
  | "2000_to_5000"
  | "over_5000";

export type AnalysisVehicleValueRange = "none" | "under_500" | "500_to_2000" | "over_2000";

export type AnalysisFixedExpenses = {
  housingCost?: number;
  foodCost?: number;
  educationCost?: number;
  transportCost?: number;
  otherFixedCost?: number;
};

export type AnalysisDebtBreakdown = {
  bankLoan?: number;
  cardDebt?: number;
  capitalLoan?: number;
  privateDebt?: number;
  personalBorrowing?: number;
};

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
  monthlyIncomeRange: AnalysisMonthlyIncomeRange;
  housingType: AnalysisHousingType;
  fixedExpenses: AnalysisFixedExpenses;
  debtBreakdown: AnalysisDebtBreakdown;
  overduePeriod: AnalysisOverduePeriod;
  debtCauses: AnalysisDebtCause[];
  realEstateBreakdown: AnalysisRealEstateBreakdown;
  financialAssetRange: AnalysisFinancialAssetRange;
  vehicleValueRange: AnalysisVehicleValueRange;
  hasPreviousBankruptcy: boolean;
  previousBankruptcyNote?: string;
  hasGuarantorRelation: boolean;
  guarantorNote?: string;
  hasActiveLawsuit: boolean;
  lawsuitNote?: string;
  creditorCount?: number;
  hasTaxArrears?: boolean;
  hasRecentAssetDisposal?: boolean;
  additionalNotes?: string;
};

export type CreateAnalysisInput = AnalysisFormInput & {
  projectId: string;
  customerId?: number; // 기존 고객과 바로 매칭
};

export type UpdateAnalysisInput = {
  projectId: string;
  status?: AnalysisStatus;
  trackingProcedure?: AnalysisProcedureType;
  currentProcedureStep?: number;
};

// PATCH /v1/analysis/{id}/input — 입력값 수정 + AI 재진단. customerId는 없음(고객 매칭은
// matchCustomer/unmatchCustomer로 별도 처리). 성공 시 status/trackingProcedure/
// currentProcedureStep이 초기화되고 AI 채팅 이력이 삭제된다 — 호출 전 UI에서 확인 필요.
export type ReanalyzeAnalysisInput = AnalysisFormInput & {
  projectId: string;
};

// ============================================
// 분석 상세/결과
// ============================================

// 서버가 입력값으로부터 계산해 채워주는 필드 포함
export type AnalysisInputData = AnalysisFormInput & {
  estimatedMonthlyIncome: number;
  totalMonthlyExpense: number;
  disposableIncome: number;
  totalDebt: number;
  totalRealEstateValue: number;
};

export type AnalysisProcedureConditions = {
  satisfied: string[];
  needsSupplement: string[];
  riskFactors: string[];
};

export type AnalysisProcedureConditionsMap = {
  individualRehabilitation: AnalysisProcedureConditions;
  debtAdjustment: AnalysisProcedureConditions;
  bankruptcy: AnalysisProcedureConditions;
};

export type AnalysisScores = {
  individualRehabilitation: number;
  debtAdjustment: number;
  bankruptcy: number;
};

export type AnalysisExpectedRepayment = {
  /** 원(KRW) 단위 — UI 매핑 시 만원으로 변환 */
  monthlyPayment: number;
  periodMonths: number;
  /** 원(KRW) 단위 — UI 매핑 시 만원으로 변환 */
  totalPayment: number;
  /** 원(KRW) 단위 — UI 매핑 시 만원으로 변환 */
  expectedExemption: number;
};

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
  expectedRepayment: AnalysisExpectedRepayment;
  precautions: string[];
  consultingScripts: AnalysisConsultingScripts;
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

export type AnalysisProcedureGuidesMap = {
  individualRehabilitation: AnalysisProcedureGuide;
  debtAdjustment: AnalysisProcedureGuide;
  bankruptcy: AnalysisProcedureGuide;
};

export type AnalysisDetail = {
  id: number;
  projectId: number;
  memberId: number | null; // 담당 멤버 ID (null이면 배정대기)
  customerId: number | null; // 매칭된 고객 ID
  status: AnalysisStatus;
  trackingProcedure: AnalysisProcedureType | null;
  currentProcedureStep: number | null;
  inputData: AnalysisInputData;
  analysisResult: AnalysisResult | null;
  procedureGuides: AnalysisProcedureGuidesMap | null;
  isShared: boolean; // 공유(납품)받은 분석 건 여부
  sourceProjectName: string | null; // 공유받은 경우 원본(영업) 프로젝트 이름
  createdAt: string;
  updatedAt: string;
};

export type CreateAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type AnalysisDetailResponse = ApiSuccess<AnalysisDetail>;
export type UpdateAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type ReanalyzeAnalysisResponse = ApiSuccess<AnalysisDetail>;
export type DeleteAnalysisResponse = ApiSuccess<Record<string, never>>;

// ============================================
// 분석 목록
// ============================================

export type AnalysisListItem = {
  id: number;
  status: AnalysisStatus;
  customerName: string;
  region: string;
  totalDebt: number;
  disposableIncome: number;
  recommendation: AnalysisProcedureType;
  trackingProcedure: AnalysisProcedureType | null;
  score: number | null; // Swagger 예시가 {}로 표기되어 있어 실제 응답으로 재확인 필요
  currentProcedureStep: number | null;
  isShared: boolean;
  sourceProjectName: string | null;
  createdAt: string;
};

export type AnalysisListQuery = {
  projectId: string;
  status?: AnalysisStatus;
  procedure?: AnalysisProcedureType;
  search?: string;
  page?: number;
  limit?: number;
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
};

export type ConnectableCustomersQuery = {
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
  partnerId: number;
};

export type DeliverAnalysisResponse = ApiSuccess<AnalysisDelivery>;

// ⚠️ Swagger 예시는 data가 단일 객체로 표기돼 있으나 "공유 이력 조회"이므로 배열일 가능성이 높다.
// 실제 응답 확인 후 필요시 수정.
export type AnalysisDeliveriesResponse = ApiSuccess<AnalysisDelivery[]>;

export type RevokeAnalysisDeliveryResponse = ApiSuccess<Record<string, never>>;

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

// 개별회생/채무조정/파산 3개 절차의 마스터 데이터를 모두 반환하는 것으로 추정(쿼리 파라미터 없음).
// 실제 응답 확인 후 필요시 수정.
export type AnalysisProceduresResponse = ApiSuccess<AnalysisProcedureMaster[]>;
