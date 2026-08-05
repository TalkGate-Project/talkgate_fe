// 회생·파산 진단 도메인 타입

import type {
  AnalysisBusinessOperationStatus,
  AnalysisDebtInputMode,
  AnalysisDebtItem,
  AnalysisDebtItemType,
  AnalysisFreshStartFundInsolvencyReason,
  AnalysisInputData,
  AnalysisProcedureType,
  AnalysisRepaymentMethod,
  AnalysisStatus,
} from "@/types/analysis";
import type { FeePlan, FeePlanSummary } from "@/types/analysisFeePlan";

// ── 상태값 ───────────────────────────────────────────────────
// 상태 코드는 절차 코드(RecommendedProcedure)와 달리 API와 UI 값이 동일해 별도 매핑 없이
// AnalysisStatus를 그대로 재사용한다.
export const DIAGNOSIS_STATUS_LABEL: Record<AnalysisStatus, string> = {
  consulting: "상담중",
  reviewing: "검토중",
  rejected: "반려됨",
  contract_pending: "계약대기중",
  in_progress: "절차진행중",
  // ⚠️ 회의 메모에 없던 상태값 — 정확한 의미(변호사 프로젝트 일시중단 등) 확인 필요.
  suspended: "중단됨",
};

// 절차안내는 계약 체결(contract_pending) 이후부터 이용 가능. 트래킹 절차 전환(개인회생/파산 변경,
// currentProcedureStep 없이 호출)과 문자 발송에 적용 — PATCH /v1/analysis/{id}가 절차
// 자체를 바꾸는 요청은 계약대기중부터도 허용하기 때문.
export const DIAGNOSIS_PROCEDURE_GUIDE_UNLOCKED_STATUSES: readonly AnalysisStatus[] = [
  "contract_pending",
  "in_progress",
  "suspended",
];

// "현재 단계로 설정"(currentProcedureStep 지정) 전용 잠금 기준. 실 API 스펙상 PATCH
// /v1/analysis/{id}의 절차 진행 단계 업데이트는 절차진행중(in_progress) 상태에서만 허용된다 —
// 위 GUIDE_UNLOCKED_STATUSES보다 좁다(contract_pending/suspended 제외).
export const DIAGNOSIS_PROCEDURE_STEP_UNLOCKED_STATUSES: readonly AnalysisStatus[] = [
  "in_progress",
];

// 정보수정(재분석) 가능 여부 판정 — 버튼 게이트(ResultHeader)와 URL 직접진입 게이트
// (DiagnosisFormContent)가 동일 기준을 쓰도록 한 곳으로 모은다. 두 게이트가 어긋나면
// 버튼은 막히는데 URL로는 통과하는(또는 그 반대) 구멍이 생긴다.
//
// - 공유(납품)받은 건: 원본 영업 데이터라 재분석 불가.
// - 영업점 자체 건: 상담중/반려만 (기존 정책).
// - 변호사 자체 생성건: 상담중을 거치지 않고 바로 계약대기중으로 생성되므로, 상담중/반려에
//   더해 계약대기중(contract_pending)에서도 수정 가능해야 한다.
export function canEditDiagnosisInfo(params: {
  status: AnalysisStatus;
  isReceivedShare: boolean;
  isAnalysisProject: boolean;
}): boolean {
  if (params.isReceivedShare) return false;
  const baseEditable = params.status === "consulting" || params.status === "rejected";
  if (params.isAnalysisProject) return baseEditable;
  // 변호사 자체 생성건(공유받지 않은 건) — 계약대기중도 허용
  return baseEditable || params.status === "contract_pending";
}

// ── 추천 절차 ────────────────────────────────────────────────
// 코드는 내부 분기(배지 색상/탭 필터/분포 집계)용, 라벨은 UI 표시용.
// 2026-08-04: 도메인 코드("individual_rehab")와 실 API 코드("individual_rehabilitation")를
// 따로 두고 서비스 계층에서 양방향 매핑하던 이중 체계를 폐기하고 API enum 값으로 일원화했다.
// 절차가 6종으로 늘면서 매핑 테이블·Record 타입을 절차마다 이중 관리해야 하는 비용이 커졌고,
// 신규 절차를 API와 다르게 명명할 이유도 없다.
export type RecommendedProcedure = AnalysisProcedureType;

export const RECOMMENDED_PROCEDURE_LABEL: Record<RecommendedProcedure, string> = {
  individual_rehabilitation: "개인회생",
  bankruptcy: "개인파산",
  fresh_start_fund: "새출발기금",
  speedy_debt_adjustment: "신속채무조정",
  pre_workout: "프리워크아웃",
  personal_workout: "개인워크아웃",
};

// 탭/분포/셀렉트에서 반복 렌더링할 때 사용하는 순서 고정 배열 — 사용자에게 "선택 가능한 절차"로
// 노출되는 목록의 단일 소스다. GET /v1/analysis의 procedure 필터와 PATCH /v1/analysis/{id}의
// trackingProcedure가 모두 6종을 수용하는 것을 확인했다(2026-08-04 Swagger).
export const RECOMMENDED_PROCEDURE_ORDER: RecommendedProcedure[] = [
  "individual_rehabilitation",
  "bankruptcy",
  "fresh_start_fund",
  "speedy_debt_adjustment",
  "pre_workout",
  "personal_workout",
];

// ── 목록 아이템 ──────────────────────────────────────────────
export type CustomerGender = "male" | "female";

export type DiagnosisListItem = {
  id: string;
  customerName: string;
  // 목록 API에 있으면 채움. 숫자 나이(age) 또는 연령대 라벨(ageGroupLabel: "40대") 중 하나.
  age?: number;
  ageGroupLabel?: string;
  gender?: CustomerGender;
  occupation?: string; // 표시용: 자영업, 프리랜서 등
  region: string; // 표시용: 서울, 경기·인천 등
  totalDebtManwon: number; // 총 채무 (만원)
  monthlyAvailableIncomeManwon: number; // 월 가용 소득 (만원, 음수 가능)
  status: AnalysisStatus;
  // 절차진행중이면 현재 추적 절차, 그 이전 단계에서는 AI 추천 절차. 아직 알 수 없는 경우도 있어
  // optional로 정직하게 표현.
  recommendedProcedure?: RecommendedProcedure;
  // 계약대기중 이후 입력된 경우에만 존재하는 수임료 결제정보 요약
  feePlanSummary: FeePlanSummary | null;
  progressStep: number; // 절차 안내 진행 단계 (1-based). 아직 추적 시작 전이면 1
  isShared: boolean; // 공유(납품) 관련 건 여부 — 삭제 가능 여부 등에 사용. 고객 연결 여부와는 다름(isCustomerConnected 참고)
  // 공유 연결 상태. delivered=공유중, rejected=반려됨, revoked=철회됨. 연결 없으면 null.
  deliveryStatus?: "delivered" | "revoked" | "rejected" | null;
  // 과거에 공유한 적 있는 건이면 채워짐 — 재공유 시 동일 프로젝트로 제한하는 데 사용
  // (AnalysisShareModal의 lockedPartner). partnerId는 공유 API 호출 시 그대로 사용.
  lawyerProjectId?: number | null;
  lawyerProjectName?: string | null;
  partnerId?: number | null;
  // 고객과 연결되어 있는지 여부. 목록의 체인 아이콘 노출 조건 — isShared와 혼동 금지.
  isCustomerConnected: boolean;
  consultedAt: string; // ISO 날짜 (YYYY-MM-DD)
  // 담당직원 (납품/배정 멤버 우선, 없으면 생성 멤버)
  assigneeName?: string;
  assigneeProfileImageUrl?: string;
  assigneeProjectName?: string;
  // 반려됨 상태일 때 마지막 반려 사유. 목록 API가 아직 안 내려줘서 대부분 null — 백엔드 반영 전이면
  // 응답에 없을 수 있어 옵셔널(StatusBadge 툴팁이 값 있을 때만 노출하므로 생략돼도 안전).
  rejectionReason?: string | null;
};

export type ProcedureStepTitlesByProcedure = Partial<
  Record<RecommendedProcedure, readonly string[]>
>;

// 목록 테이블 "진행단계" 셀용 폴백. 상세 API의 procedureGuides가 목록에는 없어 절차별 단계명이
// 필요한데, 실 마스터 데이터(GET /v1/analysis/procedures, useAnalysisProcedureMaster)가 아직
// 로딩 전이거나 실패했을 때만 이 값을 쓴다 — 정상 상황에선 마스터 데이터가 우선한다.
// (개인회생 9단계는 기존 mock/피그마 값 — 실 API와 단계 수가 다를 수 있음을 감안한 방어값.)
// 신규 4종(새출발기금·신용회복 3종)은 단계명을 아직 모른다 — 폴백을 비워두면
// getProgressStepMeta가 "확인 중"으로 떨어져 목록이 깨지지 않는다.
export const PROCEDURE_PROGRESS_STEP_TITLES: ProcedureStepTitlesByProcedure = {
  individual_rehabilitation: [
    "신청 전 상담",
    "신청서 작성 및 접수",
    "금지명령·중지명령",
    "보정권고·보정명령",
    "개시결정",
    "채권자집회",
    "인가결정",
    "변제 수행",
    "면책결정",
  ],
  bankruptcy: ["신청 전 상담", "신청서 접수", "파산선고", "면책심문", "면책결정", "종료"],
};

export function getProgressStepMeta(
  procedure: RecommendedProcedure | undefined,
  step: number,
  stepTitlesByProcedure: ProcedureStepTitlesByProcedure = PROCEDURE_PROGRESS_STEP_TITLES
): { current: number; total: number; title: string } {
  // 분석이 아직 완료되지 않았거나(추천 절차 미확정) 백엔드가 알 수 없는 값을 내려주면
  // procedure가 없을 수 있다 — 목록 전체가 죽지 않도록 방어적으로 처리.
  const titles = procedure ? stepTitlesByProcedure[procedure] : undefined;
  if (!titles || titles.length === 0) {
    return { current: 1, total: 1, title: "확인 중" };
  }
  const total = titles.length;
  const current = Math.min(Math.max(1, step), total);
  return { current, total, title: titles[current - 1] ?? `${current}단계` };
}

// 절차진행중 상태뱃지에 붙는 "현재/총단계" (예: "5/9"). 총단계를 모르면 생략.
export function resolveInProgressStepLabel(
  item: DiagnosisListItem,
  stepTitlesByProcedure?: ProcedureStepTitlesByProcedure
): string | undefined {
  if (item.status !== "in_progress") return undefined;
  const { current, total } = getProgressStepMeta(
    item.recommendedProcedure,
    item.progressStep,
    stepTitlesByProcedure
  );
  return total > 1 ? `${current}/${total}` : undefined;
}

// ── 대시보드 요약 ────────────────────────────────────────────
// GET /v1/analysis/summary 응답을 허브 UI용으로 매핑한 형태.
export type DiagnosisProgressStepItem = {
  step: number;
  title?: string;
  count: number;
};

export type DiagnosisHubSummary = {
  totalAnalysisCount: number;
  thisMonthCount: number;
  monthlyPayment: {
    totalAmount: number; // 이번 달 총 결제 금액 (면제 제외)
    totalCount: number; // 이번 달 총 결제 건수 (면제 제외)
    paidAmount: number; // 이번 달 납부 완료 금액
    paidCount: number; // 이번 달 납부 완료 건수
  };
  statusDistribution: Record<AnalysisStatus, number>;
  // 절차별 진행단계 현황 (진행단계 카드에서 셀렉트로 전환해 표시).
  // 서버가 집계 데이터가 있는 절차만 내려주므로 없는 절차는 키 자체가 없다.
  progressStepsByProcedure: Partial<Record<RecommendedProcedure, DiagnosisProgressStepItem[]>>;
};

// "상태 분포" 카드 표시 순서 — 반려(rejected)도 포함해 전체 상태 분포를 보여준다.
export const DIAGNOSIS_STATUS_DISTRIBUTION_ORDER: AnalysisStatus[] = [
  "in_progress",
  "consulting",
  "reviewing",
  "contract_pending",
  "suspended",
  "rejected",
];

// ── 목록 조회 파라미터 / 응답 ────────────────────────────────
// GET /v1/analysis의 sortType은 현재 consultationDate만 지원한다.
export type DiagnosisSortField = "consultedAt";
export type SortDirection = "asc" | "desc";

export type DiagnosisListQuery = {
  projectId: string;
  page: number;
  limit: number;
  procedure?: RecommendedProcedure; // 절차 필터. 없으면 전체
  /** 상태 필터. 미지정 시 서버가 반려(rejected)를 제외. 반려 탭은 "rejected" 전달 */
  status?: AnalysisStatus;
  keyword?: string; // 고객명/직업/지역 검색
  sortField?: DiagnosisSortField;
  sortDirection?: SortDirection;
};

export type DiagnosisListResult = {
  items: DiagnosisListItem[];
  totalCount: number;
  page: number;
  limit: number;
};

// ════════════════════════════════════════════════════════════
//  진단 제출 폼 (5단계 위저드)
// ════════════════════════════════════════════════════════════

// 알약 선택 옵션 공통 형태
export type PillOption<T extends string> = { value: T; label: string };

// ── 1. 기본정보 ──────────────────────────────────────────────
export type AgeGroup = "20s" | "30s" | "40s" | "50s" | "60s_plus";
export const AGE_GROUP_OPTIONS: PillOption<AgeGroup>[] = [
  { value: "20s", label: "20대" },
  { value: "30s", label: "30대" },
  { value: "40s", label: "40대" },
  { value: "50s", label: "50대" },
  { value: "60s_plus", label: "60대 이상" },
];

// 2026-07-24 피드백: 광역 묶음(6개) → 17개 광역시·도 단위로 세분화.
export type RegionCode =
  | "seoul"
  | "gyeonggi"
  | "incheon"
  | "busan"
  | "daegu"
  | "gwangju"
  | "daejeon"
  | "ulsan"
  | "sejong"
  | "gangwon"
  | "chungbuk"
  | "chungnam"
  | "jeonbuk"
  | "jeonnam"
  | "gyeongbuk"
  | "gyeongnam"
  | "jeju";
export const REGION_OPTIONS: PillOption<RegionCode>[] = [
  { value: "seoul", label: "서울" },
  { value: "gyeonggi", label: "경기" },
  { value: "incheon", label: "인천" },
  { value: "busan", label: "부산" },
  { value: "daegu", label: "대구" },
  { value: "gwangju", label: "광주" },
  { value: "daejeon", label: "대전" },
  { value: "ulsan", label: "울산" },
  { value: "sejong", label: "세종" },
  { value: "gangwon", label: "강원" },
  { value: "chungbuk", label: "충북" },
  { value: "chungnam", label: "충남" },
  { value: "jeonbuk", label: "전북" },
  { value: "jeonnam", label: "전남" },
  { value: "gyeongbuk", label: "경북" },
  { value: "gyeongnam", label: "경남" },
  { value: "jeju", label: "제주" },
];

export type EmploymentType =
  | "fulltime"
  | "contract"
  | "self_employed"
  | "freelancer"
  | "unemployed"
  | "other";
export const EMPLOYMENT_TYPE_OPTIONS: PillOption<EmploymentType>[] = [
  { value: "fulltime", label: "정규직" },
  { value: "contract", label: "계약직" },
  { value: "self_employed", label: "자영업" },
  { value: "freelancer", label: "프리랜서" },
  { value: "unemployed", label: "무직" },
  { value: "other", label: "기타" },
];

export type DependentCount = "0" | "1" | "2" | "3" | "4_plus";
export const DEPENDENT_OPTIONS: PillOption<DependentCount>[] = [
  { value: "0", label: "없음" },
  { value: "1", label: "1명" },
  { value: "2", label: "2명" },
  { value: "3", label: "3명" },
  { value: "4_plus", label: "4명 이상" },
];

// ── 2. 자산현황 ──────────────────────────────────────────────
// ⚠️ 실 API가 단일 카테고리(realEstateType)에서 항목별 시가 breakdown으로 바뀌어(2026-07-10),
// 채무종류처럼 중복선택 + 종류별 금액 입력으로 구조를 맞춘다.
// UI의 "없음"은 realEstateTypes=[] 로 표현하며 API에는 종류를 보내지 않는다.
export type RealEstateType = "owned" | "jeonse_deposit" | "rental_income";
export const REAL_ESTATE_OPTIONS: PillOption<RealEstateType>[] = [
  { value: "owned", label: "자가 소유" },
  { value: "jeonse_deposit", label: "전세 보증금" },
  { value: "rental_income", label: "임대 수익용" },
];

/** 부동산 보유 여부 UI용 — "없음"은 저장/API에 포함되지 않는 센티널 */
export type RealEstateSelectValue = "none" | RealEstateType;
export const REAL_ESTATE_SELECT_OPTIONS: PillOption<RealEstateSelectValue>[] = [
  { value: "none", label: "없음" },
  ...REAL_ESTATE_OPTIONS,
];

export type FinancialAssetRange = "none" | "under_500" | "500_2000" | "2000_5000" | "over_5000";
export const FINANCIAL_ASSET_OPTIONS: PillOption<FinancialAssetRange>[] = [
  { value: "none", label: "없음" },
  { value: "under_500", label: "500만 미만" },
  { value: "500_2000", label: "500만~2천만" },
  { value: "2000_5000", label: "2천만~5천만" },
  { value: "over_5000", label: "5천만 이상" },
];

export type VehicleRange = "none" | "under_500" | "500_2000" | "over_2000";
export const VEHICLE_OPTIONS: PillOption<VehicleRange>[] = [
  { value: "none", label: "없음" },
  { value: "under_500", label: "500만 미만" },
  { value: "500_2000", label: "500만~2천만" },
  { value: "over_2000", label: "2천만 이상" },
];

// ── 3. 채무현황 ──────────────────────────────────────────────
// 실 API(debtBreakdown.capitalLoan)가 캐피탈/저축은행을 슬롯 하나로만 받아, 원본이 어느 쪽이었는지
// 되돌릴 방법이 없다(2026-07-14 확인). 그래서 폼에서도 애초에 "캐피탈/저축은행"을 단일 선택지로 합쳤다.
export type DebtType =
  | "bank_loan"
  | "card_loan"
  | "capital"
  | "private_loan"
  | "personal_borrowing";
export const DEBT_TYPE_OPTIONS: PillOption<DebtType>[] = [
  { value: "bank_loan", label: "은행대출" },
  { value: "card_loan", label: "카드론" },
  { value: "capital", label: "캐피탈/저축은행" },
  { value: "private_loan", label: "대부업체" },
  { value: "personal_borrowing", label: "개인차용" },
];

export const DEBT_AMOUNT_LABELS: Record<DebtType, string> = {
  bank_loan: "은행 대출",
  card_loan: "카드론",
  capital: "캐피탈/저축은행",
  private_loan: "대부업체",
  personal_borrowing: "개인차용",
};

// 2026-08-04: 연체기간이 5단계 버킷 enum에서 정확한 개월 수(정수)로 바뀌었다 —
// OverduePeriod/OVERDUE_PERIOD_OPTIONS는 제거하고 숫자 입력(MonthsInput)을 쓴다.

// ── 채무 입력 모드 (간편/상세) ──────────────────────────────
export const REPAYMENT_METHOD_OPTIONS: PillOption<AnalysisRepaymentMethod>[] = [
  { value: "equal_principal_and_interest", label: "원리금균등" },
  { value: "equal_principal", label: "원금균등" },
  { value: "bullet_payment", label: "만기일시" },
  { value: "interest_only", label: "이자만납입" },
];

// 상세 채무 항목의 채무종류. 간편모드의 DebtType(폼 코드)과 값이 달라(card_loan vs card_debt 등)
// 별도 옵션으로 두고, 서비스 계층에서 DEBT_TYPE_TO_ITEM_TYPE으로 상호 변환한다.
export const DEBT_ITEM_TYPE_OPTIONS: PillOption<AnalysisDebtItemType>[] = [
  { value: "bank_loan", label: "은행대출" },
  { value: "card_debt", label: "카드론" },
  { value: "capital_loan", label: "캐피탈/저축은행" },
  { value: "private_debt", label: "대부업체" },
  { value: "personal_borrowing", label: "개인차용" },
];

/** 상세모드 폼 행 상태. 금액(*Won)은 API와 동일하게 원 단위로 보관한다 */
export type DebtItemFormState = AnalysisDebtItem;

export function createEmptyDebtItem(id: string): DebtItemFormState {
  return {
    id,
    debtType: "bank_loan",
    isCollateralLoan: false,
    creditorName: "",
    repaymentMethod: "equal_principal_and_interest",
    overdueMonths: 0,
    loanDate: "",
    maturityDate: "",
    principalWon: 0,
    interestRate: 0,
    termMonths: 0,
    monthlyPaymentWon: 0,
    totalInterestWon: 0,
    totalRepaymentWon: 0,
  };
}

export type DebtCause =
  | "business_failure"
  | "living_expenses"
  | "medical"
  | "investment_loss"
  | "guarantee_damage"
  | "other";
export const DEBT_CAUSE_OPTIONS: PillOption<DebtCause>[] = [
  { value: "business_failure", label: "사업실패" },
  { value: "living_expenses", label: "생활비 부족" },
  { value: "medical", label: "의료비" },
  { value: "investment_loss", label: "투자손실" },
  { value: "guarantee_damage", label: "보증피해" },
  { value: "other", label: "기타" },
];

// 2026-08-04: 채권자 수는 더 이상 사용자가 직접 고르거나 화면에 노출하지 않는다.
// 간편모드는 선택된 채무종류 배지 개수, 상세모드는 채무 항목 테이블의 행 개수를 그대로
// 채권자 수로 써서 분석 제출 시점에만 계산해 보낸다(services/debtRelief.ts의
// toAnalysisFormInput 참고). 두 모드 모두 이미 "채무종류 1개 이상"/"채무 항목 1개 이상"을
// 필수값으로 검증하므로 채권자 수가 0이 되는 경우는 존재하지 않아 별도 필수값 검사도 두지 않는다.

// ── 4. 소득/지출 ─────────────────────────────────────────────
export type MonthlyIncomeRange = "under_100" | "100_200" | "200_300" | "300_400" | "over_400";
export const MONTHLY_INCOME_OPTIONS: PillOption<MonthlyIncomeRange>[] = [
  { value: "under_100", label: "100만 이하" },
  { value: "100_200", label: "100~200만" },
  { value: "200_300", label: "200~300만" },
  { value: "300_400", label: "300~400만" },
  { value: "over_400", label: "400만 이상" },
];

// 월 소득 구간 → 추정 대표값 (만원, 구간 중앙값 기준)
export const MONTHLY_INCOME_ESTIMATE: Record<MonthlyIncomeRange, number> = {
  under_100: 80,
  "100_200": 150,
  "200_300": 250,
  "300_400": 350,
  over_400: 450,
};

export type HousingType = "owned" | "jeonse" | "monthly_rent" | "living_with_family";
export const HOUSING_TYPE_OPTIONS: PillOption<HousingType>[] = [
  { value: "owned", label: "자가" },
  { value: "jeonse", label: "전세" },
  { value: "monthly_rent", label: "월세" },
  { value: "living_with_family", label: "가족과 거주" },
];

export type MonthlyExpenses = {
  housing: number; // 주거비
  food: number; // 식비
  education: number; // 교육비
  transportation: number; // 교통비
  other: number; // 기타 고정지출
};

// ── 5. 기타사항 ──────────────────────────────────────────────
// 2026-07-24 피드백: 특례 대상 — 중복선택 가능(단, 만 29세 이하/만 65세 이상은 동시 선택 불가,
// Step5Others.tsx의 handleSpecialEligibilityChange에서 상호배타 처리).
export type SpecialEligibilityType =
  | "age_29_or_under"
  | "age_65_or_over"
  | "severe_disability"
  | "jeonse_fraud_victim";
export const SPECIAL_ELIGIBILITY_OPTIONS: PillOption<SpecialEligibilityType>[] = [
  { value: "age_29_or_under", label: "만 29세 이하" },
  { value: "age_65_or_over", label: "만 65세 이상" },
  { value: "severe_disability", label: "중증 장애인" },
  { value: "jeonse_fraud_victim", label: "전세사기 피해자" },
];

// 2026-08-05: 새출발기금 상세 항목 — isOperatingBusiness가 true일 때만 노출되는 하위 4종.
// API enum과 로컬 폼 값이 1:1로 같아 별도 FROM/TO 변환表 없이 AnalysisXxx 타입을 그대로 쓴다
// (debtInputMode/housingType 등과 동일한 패턴).
export const BUSINESS_OPERATION_STATUS_OPTIONS: PillOption<AnalysisBusinessOperationStatus>[] = [
  { value: "operating", label: "영업중" },
  { value: "suspended", label: "휴업" },
  { value: "closed_individual", label: "폐업(개인)" },
  { value: "closed_corporate", label: "법인 폐업" },
];

// "해당없음"은 다른 항목과 상호배타 — Step5Others.tsx의 핸들러에서 처리.
export const FRESH_START_FUND_INSOLVENCY_REASON_OPTIONS: PillOption<AnalysisFreshStartFundInsolvencyReason>[] = [
  { value: "overdue_3_months", label: "3개월 이상 연체" },
  { value: "maturity_extension_or_payment_deferral", label: "만기연장·상환유예" },
  { value: "tax_arrears", label: "국세·지방세 체납" },
  { value: "low_credit_score", label: "신용평점 하위" },
  { value: "not_applicable", label: "해당없음" },
];

// ── 폼 전체 상태 ─────────────────────────────────────────────
export type DiagnosisFormState = {
  // 1. 기본정보
  customerName: string;
  gender: CustomerGender | null;
  ageGroup: AgeGroup | null;
  region: RegionCode | null;
  employmentType: EmploymentType | null;
  dependents: DependentCount | null;
  spouseIncome: boolean | null;

  // 2. 자산현황
  realEstateTypes: RealEstateType[]; // 중복 보유 가능
  realEstateAmounts: Partial<Record<RealEstateType, number>>; // 만원, 선택된 종류만
  financialAsset: FinancialAssetRange | null;
  vehicle: VehicleRange | null;
  /** 최근 2년 내 부동산·차량 등 재산 처분 이력 — API `hasRecentAssetDisposal` */
  hasRecentAssetDisposal: boolean;

  // 3. 채무현황
  /** 간편(simple) / 상세(detailed) 입력 모드. 두 모드는 서로 다른 필드 집합을 쓴다 */
  debtInputMode: AnalysisDebtInputMode;
  debtTypes: DebtType[]; // 간편모드 전용
  debtAmounts: Partial<Record<DebtType, number>>; // 간편모드 전용. 만원, 선택된 종류만 (캐피탈·저축은행은 capital 키)
  debts: DebtItemFormState[]; // 상세모드 전용. 금액은 원 단위
  /** 연체 개월 수. 간편모드에서만 입력받고(필수), 상세모드는 서버가 debts에서 자동 계산한다.
   * null은 "미입력"이고 0은 "연체 없음"이라는 유효한 입력이다 — 숫자 falsy로 판정하면 안 된다 */
  overdueMonths: number | null;
  debtCauses: DebtCause[];
  hasTaxArrears: boolean; // 세금/4대보험 체납 여부
  // 2026-07-24 피드백 추가 항목. API collateralDebt/debtIncurredLast3Months/debtIncurredLast1Year에
  // 대응(services/debtRelief.ts 참고).
  securedDebt: number; // 담보부채무 (만원)
  recentDebtWithin3Months: number; // 최근 3개월 내 채무액 (만원)
  recentDebtWithin1Year: number; // 최근 1년 내 채무액 (만원)

  // 4. 소득/지출
  monthlyIncome: MonthlyIncomeRange | null;
  housingType: HousingType | null;
  expenses: MonthlyExpenses;

  // 5. 기타사항
  /** 사업 영위 여부('20.4~'25.6 특례기간) — API `isOperatingBusiness`. 5단계에서만 입력.
   * 새출발기금 후보 게이트라 false면 결과에서 새출발기금이 아예 후보에서 빠진다 */
  isOperatingBusiness: boolean;
  /** 새출발기금 상세 4종 — isOperatingBusiness가 true일 때만 의미있음(제출 시 services/debtRelief.ts에서 조건부 전송) */
  businessOperationStatus: AnalysisBusinessOperationStatus | null;
  freshStartFundInsolvencyReasons: AnalysisFreshStartFundInsolvencyReason[];
  isExcludedIndustryForFreshStartFund: boolean;
  hasPreviousFreshStartFundApplication: boolean;
  hasPreviousApplication: boolean;
  previousApplicationDetail: string;
  hasGuarantor: boolean;
  guarantorDetail: string;
  hasOngoingLitigation: boolean;
  litigationDetail: string;
  // 2026-07-24 피드백 추가 항목. API specialEligibilities에 대응(services/debtRelief.ts 참고).
  // 중복선택 가능(만 29세 이하/만 65세 이상은 상호배타).
  specialEligibility: SpecialEligibilityType[];
  counselorMemo: string;
};

export function createEmptyDiagnosisForm(): DiagnosisFormState {
  return {
    customerName: "",
    gender: null,
    // 새 진단: 어쩔 수 없는 기본값(토글 off, 금액 0 등)을 제외하면 뱃지를 미리 선택하지 않는다.
    ageGroup: null,
    region: null,
    employmentType: null,
    dependents: null,
    spouseIncome: null,
    isOperatingBusiness: false,
    realEstateTypes: [],
    realEstateAmounts: {},
    financialAsset: null,
    vehicle: null,
    hasRecentAssetDisposal: false,
    debtInputMode: "simple",
    debtTypes: [],
    debtAmounts: {},
    debts: [],
    overdueMonths: null,
    debtCauses: [],
    hasTaxArrears: false,
    securedDebt: 0,
    recentDebtWithin3Months: 0,
    recentDebtWithin1Year: 0,
    monthlyIncome: null,
    housingType: null,
    expenses: { housing: 0, food: 0, education: 0, transportation: 0, other: 0 },
    businessOperationStatus: null,
    freshStartFundInsolvencyReasons: [],
    isExcludedIndustryForFreshStartFund: false,
    hasPreviousFreshStartFundApplication: false,
    hasPreviousApplication: false,
    previousApplicationDetail: "",
    hasGuarantor: false,
    guarantorDetail: "",
    hasOngoingLitigation: false,
    litigationDetail: "",
    specialEligibility: [],
    counselorMemo: "",
  };
}

// 폼에서 파생되는 요약 값 (좌측 사이드바 · 소득/지출 계산)
export type DiagnosisDerivedValues = {
  totalDebtManwon: number; // 선택한 채무 금액 합
  estimatedMonthlyIncomeManwon: number; // 월 소득 구간 대표값
  totalExpenseManwon: number; // 월 고정지출 합
  monthlyAvailableIncomeManwon: number; // 추정소득 − 총지출
};

export type CreateDiagnosisResult = { id: string };

// ════════════════════════════════════════════════════════════
//  진단 결과 상세 (AI 분석 결과)
// ════════════════════════════════════════════════════════════

// 절차별 성공 등급
export type ProcedureGrade = "good" | "normal" | "low";
export const PROCEDURE_GRADE_LABEL: Record<ProcedureGrade, string> = {
  good: "양호",
  normal: "보통",
  low: "낮음",
};

export type ProcedureScore = {
  procedure: RecommendedProcedure;
  label: string; // "개인회생", "파산"
  score: number; // 0~100
  grade: ProcedureGrade;
  recommended: boolean;
};

// 조건 분석 항목 상태
export type ConditionStatus = "met" | "caution" | "risk";
export const CONDITION_STATUS_LABEL: Record<ConditionStatus, string> = {
  met: "충족",
  caution: "보충필요",
  risk: "위험요소",
};

export type ConditionItem = { status: ConditionStatus; text: string };

// 채무 현황
export type DebtComposition = { label: string; amountManwon: number; percent: number };

export type DebtStatusSummary = {
  totalDebtManwon: number;
  /** 총 상환 예정·이자 포함 (만원). 채무 상세입력 모드 건에만 존재 — 없으면 "총 상환 예정" 지표 자체를 숨긴다 */
  totalDebtWithInterestManwon?: number;
  totalAssetManwon: number;
  monthlyAvailableIncomeManwon: number;
  overdueMonths: number;
  composition: DebtComposition[];
};

// 예상 변제 계획 — 절차 하나에 대한 수치. "주의사항"은 절차와 무관하게 공통이라 여기 담지
// 않고 DiagnosisDetail.repaymentNotes로 별도 둔다(어떤 절차를 선택해도 항상 접근 가능해야
// 하는데, 신용회복 일부 절차는 이 타입 자체가 아예 없기 때문 — 아래 주석 참고).
export type RepaymentPlan = {
  monthlyPaymentManwon: number;
  months: number;
  years: number;
  totalPaymentManwon: number;
  exemptedDebtManwon: number;
  /** 이자 포함 예상 면책 채무 (만원). 상세입력 모드 건에만 존재 — 없으면 병기 자체를 숨긴다 */
  exemptedDebtWithInterestManwon?: number;
};

// 상담 포인트
export type CounselMentCategory = "core" | "concern" | "next";
export const COUNSEL_MENT_TABS: { key: CounselMentCategory | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "core", label: "핵심설명" },
  { key: "concern", label: "우려해소" },
  { key: "next", label: "다음단계" },
];
export type CounselMent = { category: CounselMentCategory; text: string };

// 절차 안내 단계
export type ProcedureStepStatus = "done" | "in_progress" | "pending";
export type ProcedureStepNoteType = "default" | "warning" | "info";
export type ProcedureStep = {
  step: number;
  title: string;
  period: string;
  detail?: string;
  checklist?: string[];
  note?: string;
  noteType?: ProcedureStepNoteType;
  status: ProcedureStepStatus;
  // 실 API의 stepId (PATCH /v1/analysis/{id}에 currentProcedureStep으로 보낼 때 사용). mock 데이터에는 없음.
  stepId?: number;
};

export type ProcedureGuide = {
  procedureLabel: string; // "개인회생 · 9단계"
  totalSteps: number;
  currentStep: number; // 1-based. 0이면 아직 추적 시작 전(어떤 단계도 진행중이 아님)
  estimatedRemaining: string; // "약 3년 11개월"
  totalPeriodHint: string; // "42~54개월"
  progressPercent: number;
  steps: ProcedureStep[];
};

/** 절차 단계 변경 이력 (UI 표시용 — 상세 procedureStepHistory에서 매핑) */
export type ProcedureStepHistoryItem = {
  stepId: number;
  changedByMemberName: string;
  changedByProjectName?: string | null;
  changedAt: string;
};

/** 분석 상세 전달사항(messages) — 공유/반려/수락/수임료 액션 히스토리 */
export type DiagnosisMessageType =
  | "share"
  | "reject"
  | "accept"
  | "fee_create"
  | "fee_update"
  | "fee_stop"
  | "fee_refund";

export type DiagnosisMessage = {
  type: DiagnosisMessageType;
  memberName: string;
  projectId: number;
  projectName: string | null;
  message: string | null;
  createdAt: string;
};

export type DiagnosisDetail = {
  id: string;
  customerName: string;
  // 실 API에는 정확한 나이(숫자)가 없고 연령대만 있어 라벨(예: "40대")로 표시한다.
  ageGroupLabel: string;
  gender: CustomerGender;
  occupation: string;
  // 매칭된 고객이 없으면 빈 문자열. customerId가 null이면 문자 발송 UI를 비활성화한다.
  phone: string;
  customerId: number | null;
  consultedAt: string; // ISO datetime
  isShared: boolean;
  // 다른(영업) 프로젝트에서 공유(납품)받은 건인지 여부. 원본 출처(source) 정보가 있으면 true —
  // source 필드는 "받은 쪽"에만 존재해 방향을 정확히 가른다(반려/철회된 공유 건도 출처 정보는 남아 포함).
  // deliveryStatus는 공유 양쪽 모두에 남아 판별에 쓰면 영업점 자기 데이터를 오판하므로 쓰지 않는다.
  // 변호사 프로젝트가 직접 등록한 건은 false → 소유자 액션(연동/수정/결제)을 노출한다.
  isReceivedShare: boolean;
  status: AnalysisStatus;
  // 반려됨 상태인 경우 변호사 프로젝트가 남긴 반려 사유. 목록에는 없는 상세 전용 필드.
  rejectionReason: string | null;
  // 공유 연결 상태. delivered=공유중(수락 이후에도 연결이 유지되는 한 계속 delivered — "검토 대기"라는
  // 뜻이 아님), rejected=반려됨, revoked=철회됨. 연결 없으면 null.
  // status가 "reviewing"이고 이 값이 "delivered"일 때만 변호사 프로젝트에 수락/반려 배너를 띄운다.
  deliveryStatus: "delivered" | "revoked" | "rejected" | null;
  // 과거에 공유한 적 있는 건이면 채워짐 — 재공유 시 동일 프로젝트로 제한하는 데 사용
  // (AnalysisShareModal의 lockedPartner). partnerId는 공유 API 호출 시 그대로 사용.
  lawyerProjectId?: number | null;
  lawyerProjectName?: string | null;
  partnerId?: number | null;
  // 담당직원 (납품/배정 멤버 우선, 없으면 생성 멤버) — 변호사(lawyer) 프로젝트 상세 헤더용
  assigneeName?: string;
  assigneeProfileImageUrl?: string;
  assigneeProjectName?: string;
  recommendedProcedure: RecommendedProcedure;
  // 실제 상담사가 추적 중인 절차 — AI 추천(recommendedProcedure/recommendation)과 별개.
  // 결과 상세 최상단 타이틀에서 사용 (추적 절차 변경 기능 대비 분리).
  trackingProcedure: RecommendedProcedure;
  successProbability: number;
  recommendation: { title: string; description: string; tags: string[] };
  procedureScores: ProcedureScore[];
  // 추천 절차 기준 조건 분석 (문자 발송 템플릿 등에서 사용)
  conditionAnalysis: ConditionItem[];
  // 절차별 조건 분석 — 결과 페이지에서 절차 선택 시 전환 표시용.
  // 자격 게이트를 통과하지 못한 절차(예: 사업 미영위 시 새출발기금)는 키가 없다.
  conditionAnalysisByProcedure: Partial<Record<RecommendedProcedure, ConditionItem[]>>;
  debtStatus: DebtStatusSummary;
  // 개인회생 추적 시에만 노출되는 "개인회생과 개인워크아웃 비교" 문구 (없으면 null — 섹션 자체를 숨김)
  debtAdjustmentComparison: string | null;
  // 절차별 예상 변제 계획 — "절차별 성공 가능성"에서 선택된 절차 기준으로 SectionRepaymentPlan이
  // 조회한다. 신속채무조정·프리워크아웃은 백엔드가 항상 null로 내려주는 절차라 애초에 키가 없다
  // (게이트 미통과와 별개 — 이 두 절차는 분할 변제라는 개념 자체가 없어서다).
  repaymentPlanByProcedure: Partial<Record<RecommendedProcedure, RepaymentPlan>>;
  // 변제 계획 섹션의 주의사항 — 절차와 무관하게 공통 표시(analysisResult.precautions).
  repaymentNotes: string[];
  counselMents: CounselMent[];
  // 실 AI 채팅은 useDebtReliefAiChat 훅이 별도로 GET/POST /v1/analysis/{id}/chat(/stream)을
  // 통해 로드/전송한다 — 이 타입에는 대화 내역을 담지 않는다.
  aiSuggestedQuestions: string[];
  procedureGuide: ProcedureGuide;
  // 절차안내 드롭다운에서 추적 중이 아닌 절차도 "미리보기"로 볼 수 있도록 전 절차의 가이드를
  // 담아둔다. 추적 중인 절차 키만 실제 currentStep이 반영되고, 나머지는 항상 진행 전(0)이다.
  procedureGuideByProcedure: Partial<Record<RecommendedProcedure, ProcedureGuide>>;
  /** 현재 추적 절차의 단계별 변경 이력 (변경 기록이 없는 단계는 제외) */
  procedureStepHistory: ProcedureStepHistoryItem[];
  // 「고객정보」 모달용 원본 입력값. 상세 조회 시 이미 받아온 데이터라 모달에서 재조회하지 않는다.
  inputData: AnalysisInputData;
  contact: string | null;
  referenceNote: string | null;
  /** 공유/반려/수락/수임료 입력·수정 등 액션 메시지 히스토리 */
  messages: DiagnosisMessage[];
  feePlan: FeePlan | null;
};

// ════════════════════════════════════════════════════════════
//  결과 상세 - 절차/고객 안내 문자 발송
// ════════════════════════════════════════════════════════════
export type SendGuidanceSmsInput = {
  diagnosisId: string;
  recipientName: string;
  recipientPhone: string;
  senderNumberType: "project" | "member";
  senderNumberId: number;
  advertisementType: "advertising" | "informational";
  serviceName?: string;
  title?: string;
  content: string;
  scheduledAt: string;
  imageUrls?: string[];
};

export type SendGuidanceSmsResult = { success: boolean };
