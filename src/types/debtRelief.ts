// 회생·파산 진단 도메인 타입

import type { AnalysisInputData, AnalysisStatus } from "@/types/analysis";
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

// 절차안내는 계약 체결(contract_pending) 이후부터 이용 가능. 트래킹 절차 전환(개인회생/채무조정/
// 파산 변경, currentProcedureStep 없이 호출)과 문자 발송에 적용 — PATCH /v1/analysis/{id}가 절차
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

// ── 추천 절차 ────────────────────────────────────────────────
// 코드는 내부 분기(배지 색상/탭 필터/분포 집계)용, 라벨은 UI 표시용.
export type RecommendedProcedure = "individual_rehab" | "debt_adjustment" | "bankruptcy";

export const RECOMMENDED_PROCEDURE_LABEL: Record<RecommendedProcedure, string> = {
  individual_rehab: "개인회생",
  debt_adjustment: "채무조정",
  bankruptcy: "파산",
};

// 탭/분포에서 반복 렌더링할 때 사용하는 순서 고정 배열
export const RECOMMENDED_PROCEDURE_ORDER: RecommendedProcedure[] = [
  "individual_rehab",
  "debt_adjustment",
  "bankruptcy",
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

export type ProcedureStepTitlesByProcedure = Record<RecommendedProcedure, readonly string[]>;

// 목록 테이블 "진행단계" 셀용 폴백. 상세 API의 procedureGuides가 목록에는 없어 절차별 단계명이
// 필요한데, 실 마스터 데이터(GET /v1/analysis/procedures, useAnalysisProcedureMaster)가 아직
// 로딩 전이거나 실패했을 때만 이 값을 쓴다 — 정상 상황에선 마스터 데이터가 우선한다.
// (개인회생 9단계는 기존 mock/피그마 값 — 실 API와 단계 수가 다를 수 있음을 감안한 방어값.)
export const PROCEDURE_PROGRESS_STEP_TITLES: ProcedureStepTitlesByProcedure = {
  individual_rehab: [
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
  debt_adjustment: ["상담·접수", "신청", "심사", "확정", "상환 이행", "완료"],
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
  // 절차별 진행단계 현황 (진행단계 카드에서 셀렉트로 전환해 표시)
  progressStepsByProcedure: Record<RecommendedProcedure, DiagnosisProgressStepItem[]>;
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

export type RegionCode =
  | "seoul"
  | "gyeonggi_incheon"
  | "busan_gyeongnam"
  | "daegu_gyeongbuk"
  | "chungcheong_gangwon"
  | "honam_jeju";
export const REGION_OPTIONS: PillOption<RegionCode>[] = [
  { value: "seoul", label: "서울" },
  { value: "gyeonggi_incheon", label: "경기·인천" },
  { value: "busan_gyeongnam", label: "부산·경남" },
  { value: "daegu_gyeongbuk", label: "대구·경북" },
  { value: "chungcheong_gangwon", label: "충청·강원" },
  { value: "honam_jeju", label: "호남·제주" },
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
  { value: "private_loan", label: "사채" },
  { value: "personal_borrowing", label: "개인차용" },
];

export const DEBT_AMOUNT_LABELS: Record<DebtType, string> = {
  bank_loan: "은행 대출",
  card_loan: "카드론",
  capital: "캐피탈/저축은행",
  private_loan: "사채",
  personal_borrowing: "개인차용",
};

export type OverduePeriod = "none" | "under_3m" | "3_6m" | "6_12m" | "over_1y";
export const OVERDUE_PERIOD_OPTIONS: PillOption<OverduePeriod>[] = [
  { value: "none", label: "없음" },
  { value: "under_3m", label: "3개월 미만" },
  { value: "3_6m", label: "3~6개월" },
  { value: "6_12m", label: "6~12개월" },
  { value: "over_1y", label: "1년 이상" },
];

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

/** 채권자 수 구간 — API creditorCount(number)로 대표값 매핑 */
export type CreditorCountRange = "1_2" | "3_5" | "6_10" | "over_10";
export const CREDITOR_COUNT_OPTIONS: PillOption<CreditorCountRange>[] = [
  { value: "1_2", label: "1~2곳" },
  { value: "3_5", label: "3~5곳" },
  { value: "6_10", label: "6~10곳" },
  { value: "over_10", label: "10곳 이상" },
];
export const CREDITOR_COUNT_TO_NUMBER: Record<CreditorCountRange, number> = {
  "1_2": 2,
  "3_5": 4,
  "6_10": 8,
  over_10: 12,
};

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
  debtTypes: DebtType[];
  debtAmounts: Partial<Record<DebtType, number>>; // 만원, 선택된 종류만 (캐피탈·저축은행은 capital 키)
  overduePeriod: OverduePeriod | null;
  debtCauses: DebtCause[];
  creditorCount: CreditorCountRange | null; // 채권자 수 구간
  hasTaxArrears: boolean; // 세금/4대보험 체납 여부

  // 4. 소득/지출
  monthlyIncome: MonthlyIncomeRange | null;
  housingType: HousingType | null;
  expenses: MonthlyExpenses;

  // 5. 기타사항
  hasPreviousApplication: boolean;
  previousApplicationDetail: string;
  hasGuarantor: boolean;
  guarantorDetail: string;
  hasOngoingLitigation: boolean;
  litigationDetail: string;
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
    realEstateTypes: [],
    realEstateAmounts: {},
    financialAsset: null,
    vehicle: null,
    hasRecentAssetDisposal: false,
    debtTypes: [],
    debtAmounts: {},
    overduePeriod: null,
    debtCauses: [],
    creditorCount: null,
    hasTaxArrears: false,
    monthlyIncome: null,
    housingType: null,
    expenses: { housing: 0, food: 0, education: 0, transportation: 0, other: 0 },
    hasPreviousApplication: false,
    previousApplicationDetail: "",
    hasGuarantor: false,
    guarantorDetail: "",
    hasOngoingLitigation: false,
    litigationDetail: "",
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
  label: string; // "개인회생", "채무조정(워크아웃)", "파산"
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
  totalAssetManwon: number;
  monthlyAvailableIncomeManwon: number;
  overdueMonths: number;
  composition: DebtComposition[];
};

// 예상 변제 계획
export type RepaymentPlan = {
  monthlyPaymentManwon: number;
  months: number;
  years: number;
  totalPaymentManwon: number;
  exemptedDebtManwon: number;
  notes: string[];
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
  // 절차별(개인회생/채무조정/파산) 조건 분석 — 결과 페이지에서 절차 선택 시 전환 표시용
  conditionAnalysisByProcedure: Record<RecommendedProcedure, ConditionItem[]>;
  debtStatus: DebtStatusSummary;
  repaymentPlan: RepaymentPlan;
  counselMents: CounselMent[];
  // 실 AI 채팅은 useDebtReliefAiChat 훅이 별도로 GET/POST /v1/analysis/{id}/chat(/stream)을
  // 통해 로드/전송한다 — 이 타입에는 대화 내역을 담지 않는다.
  aiSuggestedQuestions: string[];
  procedureGuide: ProcedureGuide;
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
