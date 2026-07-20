import type { ApiSuccess } from "@/types/common";
import type { SenderNumberType, SmsAdvertisementType } from "@/types/sms";
import type { FeePlan, FeePlanSummary } from "@/types/analysisFeePlan";

// Analysis(채무 정리 AI 진단) 도메인 타입
// Swagger 스펙(POST/GET/PATCH/DELETE /v1/analysis 등) 기준.
// ⚠️ src/types/debtRelief.ts의 mock 전용 RecommendedProcedure는 값이 다르다
// ("individual_rehab" vs 여기의 "individual_rehabilitation"). 실 API 연동 시 값 매핑 필요.

export type AnalysisStatus =
  | "consulting"
  | "reviewing"
  | "rejected"
  | "contract_pending"
  | "in_progress"
  | "suspended";

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

/** 분석 건 액션(공유/반려/수락/수임료 입력·수정) 메시지 히스토리 항목 */
export type AnalysisMessageDto = {
  type: "share" | "reject" | "accept" | "fee_create" | "fee_update";
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
  totalDebt: number;
  disposableIncome: number;
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
    team?: { id: number; name: string } | null;
  } | null;
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
  /** AnalysisPartner.id (파트너십 레코드 id). partnerProjectId가 아님. */
  partnerId: number;
  /** 공유 시 함께 전달할 연락처 (선택) */
  contact?: string;
  /** 공유 시 함께 전달할 참고사항 (선택) */
  referenceNote?: string;
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
  referenceNote?: string;
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

export type AnalysisProcedureDistributionItem = {
  procedure: AnalysisProcedureType;
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
  averageSuccessProbability: number;
  procedureDistribution: AnalysisProcedureDistributionItem[];
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

// 개별회생/채무조정/파산 3개 절차의 마스터 데이터를 모두 반환하는 것으로 추정(쿼리 파라미터 없음).
// 실제 응답 확인 후 필요시 수정.
export type AnalysisProceduresResponse = ApiSuccess<AnalysisProcedureMaster[]>;
