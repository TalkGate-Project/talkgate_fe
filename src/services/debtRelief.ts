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
import { MOCK_DIAGNOSIS_FORM } from "@/mocks/debtReliefDetailMock";
import { AnalysisService } from "@/services/analysis";
import { CustomersService } from "@/services/customers";
import type {
  AnalysisDebtBreakdown,
  AnalysisDebtCause,
  AnalysisFinancialAssetRange,
  AnalysisFormInput,
  AnalysisListItem,
  AnalysisMonthlyIncomeRange,
  AnalysisOverduePeriod,
  AnalysisProcedureConditions,
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

// ⚠️ 백엔드 API 미구현 상태의 임시 mock 구현.
// 실제 API 연동 시 각 함수 본문을 apiClient.get(`/v1/debt-relief/...`) 호출로 교체하고
// 필터/정렬/페이지네이션은 서버로 위임한다. 함수 시그니처(입출력 타입)는 그대로 유지한다.
//
// 진행 상황(2026-07-10): 허브 페이지(/debt-relief)의 진단 목록(listDiagnoses), 생성
// 페이지(/debt-relief/new)의 진단 생성(createDiagnosis), 상세 페이지(/debt-relief/[id])의
// 읽기 전용 진단결과(getDiagnosisDetail) + 절차 단계 저장(updateProcedureProgress)을
// 실 API로 연동했다(상세 페이지 Phase 0). AI 채팅도 useDebtReliefAiChat 훅이
// AnalysisService.chatHistory/streamChatMessage로 직접 연동한다(Phase 1, DiagnosisDetail에는
// 대화 내역을 담지 않음). 고객 매칭 UI(Phase 2, CustomerMatchModal)도 완료.
// 문자 실제 발송(sendGuidanceSms, Phase 3)은 아직 mock/미연동이다.
//
// 목록 정렬은 GET /v1/analysis의 sortType/sortOrder로 서버에 위임한다
// (현재 sortType은 consultationDate만 지원).
//
// 2026-07-10 갱신: 실 API가 realEstateType(단일 카테고리)에서 realEstateBreakdown(항목별
// 시가, debtBreakdown과 동일 패턴)으로 바뀌어 폼/타입/매핑을 맞췄다. 이제 POST /v1/analysis가
// 정상 동작한다(예전 400/500 에러는 이 필드 스펙이 미확정이던 상태에서 발생한 것이었다).
//
// 재분석용 PATCH /v1/analysis/{id}/input(ReanalyzeAnalysisInput)도 새로 생겨서
// AnalysisService.reanalyze로 만들어뒀지만, DebtReliefService.updateDiagnosis는 아직
// 이걸 쓰지 않는다 — getDiagnosisForm이 여전히 mock(김민수 샘플)이라, 지금 연결하면
// [id]/edit 진입 시 실제 값 대신 mock 값이 채워진 채로 "재분석"을 눌러 실제 분석 데이터를
// 덮어쓸 위험이 있다. getDiagnosisForm을 AnalysisService.detail().inputData 역매핑으로
// 먼저 연동한 뒤 updateDiagnosis를 reanalyze로 교체할 것(Phase 3).

const MOCK_LATENCY_MS = 300;

function withMockLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

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

const FINANCIAL_ASSET_TO_ANALYSIS: Record<FinancialAssetRange, AnalysisFinancialAssetRange> = {
  none: "none",
  under_500: "under_500",
  "500_2000": "500_to_2000",
  "2000_5000": "2000_to_5000",
  over_5000: "over_5000",
};

const VEHICLE_TO_ANALYSIS: Record<VehicleRange, AnalysisVehicleValueRange> = {
  none: "none",
  under_500: "under_500",
  "500_2000": "500_to_2000",
  over_2000: "over_2000",
};

const OVERDUE_PERIOD_TO_ANALYSIS: Record<OverduePeriod, AnalysisOverduePeriod> = {
  none: "none",
  under_3m: "under_3_months",
  "3_6m": "3_to_6_months",
  "6_12m": "6_to_12_months",
  over_1y: "over_1_year",
};

const MONTHLY_INCOME_TO_ANALYSIS: Record<MonthlyIncomeRange, AnalysisMonthlyIncomeRange> = {
  under_100: "under_100",
  "100_200": "100_to_200",
  "200_300": "200_to_300",
  "300_400": "300_to_400",
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

// 캐피탈·저축은행 UI는 분리되지만 실 API capitalLoan 슬롯은 하나다.
const DEBT_TYPE_TO_BREAKDOWN_KEY: Record<DebtType, keyof AnalysisDebtBreakdown> = {
  bank_loan: "bankLoan",
  card_loan: "cardDebt",
  capital: "capitalLoan",
  savings_bank: "capitalLoan",
  private_loan: "privateDebt",
  personal_borrowing: "personalBorrowing",
};

const REAL_ESTATE_TYPE_TO_BREAKDOWN_KEY: Record<RealEstateType, keyof AnalysisRealEstateBreakdown> = {
  owned: "ownedValue",
  jeonse_deposit: "jeonseDeposit",
  rental_income: "rentalValue",
};

function optionLabel<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

// 실 API가 요구하는 필수값 중 폼에서 null일 수 있는 항목이 채워졌다는 전제 하에 호출한다.
// (호출 전 반드시 validateDiagnosisForm의 getMissingRequiredFieldLabels로 검증)
// 생성(POST /v1/analysis)과 재분석(PATCH /v1/analysis/{id}/input)이 동일한 입력 형태를
// 쓰므로 공통 매핑만 여기서 만들고, projectId/customerId 등 나머지는 호출부에서 붙인다.
function toAnalysisFormInput(form: DiagnosisFormState): AnalysisFormInput {
  const debtBreakdown: AnalysisDebtBreakdown = {};
  let capitalCounted = false;
  form.debtTypes.forEach((type) => {
    const key = DEBT_TYPE_TO_BREAKDOWN_KEY[type];
    if (key === "capitalLoan") {
      if (capitalCounted) return;
      debtBreakdown.capitalLoan = form.debtAmounts.capital ?? 0;
      capitalCounted = true;
      return;
    }
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

function toCreateAnalysisInput(projectId: string, form: DiagnosisFormState): CreateAnalysisInput {
  return { projectId, ...toAnalysisFormInput(form) };
}

function resolveAgeGroupLabel(ageGroup?: string | null): string | undefined {
  if (!ageGroup) return undefined;
  const matched = AGE_GROUP_OPTIONS.find((option) => option.value === ageGroup);
  return matched?.label ?? ageGroup;
}

function toDiagnosisListItem(item: AnalysisListItem): DiagnosisListItem {
  // ⚠️ Swagger 스펙엔 recommendation이 있었지만 실 목록 API(GET /v1/analysis) 응답엔
  // 내려오지 않고 trackingProcedure만 있다. trackingProcedure도 아직 절차 추적을
  // 시작하지 않은 건은 null일 수 있어, 그 경우엔 절차를 알 수 없는 상태로 둔다
  // (하위 UI가 "확인 중"으로 방어적으로 표시).
  const procedureCode = item.trackingProcedure ?? item.recommendation;
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
    recommendedProcedure: procedureCode ? PROCEDURE_FROM_ANALYSIS[procedureCode] : undefined,
    // "성공 가능성"에 대응하는 필드가 명세에 없어 추천 절차 적합도 점수(score)로 임시 대체.
    // 의미가 다를 수 있어 실제 화면에서 재확인 필요.
    successProbability: item.score ?? 0,
    // 아직 절차 추적을 시작하지 않아 null이면 1단계로 표시
    progressStep: item.currentProcedureStep ?? 1,
    isShared: item.isShared,
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

// analysisResult.expectedRepayment 금액 필드는 원(KRW) 단위.
// 폼/채무현황 등 나머지 UI는 만원 단위이므로 표시 전에 변환한다.
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
    const { projectId, page, limit, procedure, keyword = "", sortField, sortDirection = "desc" } = query;

    const response = await AnalysisService.list({
      projectId,
      page,
      limit,
      procedure: procedure ? PROCEDURE_TO_ANALYSIS[procedure] : undefined,
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
  async createDiagnosis(projectId: string, form: DiagnosisFormState): Promise<CreateDiagnosisResult> {
    const response = await AnalysisService.create(toCreateAnalysisInput(projectId, form));
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

    // 매칭된 고객이 있을 때만 연락처를 알 수 있다 — 없으면 문자 발송 UI가 비활성화된다.
    let phone = "";
    if (analysis.customerId != null) {
      try {
        const customerRes = await CustomersService.detail(String(analysis.customerId)).withProject(projectId);
        phone = customerRes.data?.data?.contact1 ?? "";
      } catch (error) {
        console.error("Failed to load matched customer contact:", error);
      }
    }

    const guideKey = PROCEDURE_TO_SCORE_KEY[analysis.trackingProcedure ?? recommendation];
    const guide = analysis.procedureGuides?.[guideKey];
    const totalDebt = inputData.totalDebt;

    return {
      id: String(analysis.id),
      customerName: inputData.customerName,
      ageGroupLabel: inputData.ageGroup,
      gender: inputData.gender,
      occupation: inputData.employmentType,
      phone,
      customerId: analysis.customerId,
      consultedAt: analysis.createdAt,
      recommendedProcedure,
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
            exemptedDebtManwon: wonToManwon(analysis.analysisResult.expectedRepayment.expectedExemption),
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
    };
  },

  // 절차안내 "현재 단계로 설정" 저장. step.stepId는 실 API의 procedureGuides[].steps[].stepId다.
  async updateProcedureProgress(
    projectId: string,
    id: string,
    input: { trackingProcedure: RecommendedProcedure; currentProcedureStep: number }
  ): Promise<void> {
    await AnalysisService.update(Number(id), {
      projectId,
      trackingProcedure: PROCEDURE_TO_ANALYSIS[input.trackingProcedure],
      currentProcedureStep: input.currentProcedureStep,
    });
  },

  // 편집(정보 수정) 진입 시 폼에 채울 원본 입력값 조회.
  getDiagnosisForm(_projectId: string, _id: string): Promise<DiagnosisFormState> {
    return withMockLatency(MOCK_DIAGNOSIS_FORM);
  },

  // 진단 수정(재분석 요청). 실제 API 연동 시 PUT/PATCH로 교체한다.
  updateDiagnosis(
    _projectId: string,
    id: string,
    _form: DiagnosisFormState
  ): Promise<CreateDiagnosisResult> {
    return withMockLatency({ id });
  },

  // 진단 삭제 (공유받은 분석 건은 백엔드에서 거부될 수 있음)
  async deleteDiagnosis(projectId: string, id: string): Promise<void> {
    await AnalysisService.remove(Number(id), projectId);
  },

  // 결과 상세 - 절차 안내 / 고객 안내 문자 발송. 발송 API 미구현 상태의 mock.
  // 실제 연동 시 SmsService.send처럼 백엔드로 위임하도록 본문만 교체한다.
  sendGuidanceSms(
    _projectId: string,
    _input: SendGuidanceSmsInput
  ): Promise<SendGuidanceSmsResult> {
    return withMockLatency({ success: true });
  },
};
