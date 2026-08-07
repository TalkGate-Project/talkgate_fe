import type { DebtItemFormState, DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepKey } from "./steps";

export type MissingDebtItemField = "loanDate" | "maturityDate" | "principalWon" | "interestRate";

const MISSING_DEBT_ITEM_FIELD_LABELS: Record<MissingDebtItemField, string> = {
  loanDate: "대출일",
  maturityDate: "만기일",
  principalWon: "금액",
  interestRate: "금리",
};

/**
 * 상세모드 채무 항목 1건에서 비어있는 필드를 반환한다.
 * 연체(개월)는 0이 "연체 없음"이라는 유효한 기본값이라 여기서 검사하지 않는다.
 */
export function getMissingDebtItemFields(debt: DebtItemFormState): MissingDebtItemField[] {
  const missing: MissingDebtItemField[] = [];
  if (!debt.loanDate) missing.push("loanDate");
  if (!debt.maturityDate) missing.push("maturityDate");
  if (!debt.principalWon) missing.push("principalWon");
  if (!debt.interestRate) missing.push("interestRate");
  return missing;
}

// 채무현황 스텝의 필수값은 입력 모드에 따라 달라진다.
// - 간편(simple): 채무종류 선택 + 연체기간 직접 입력
// - 상세(detailed): 채무 항목 1건 이상. 연체기간은 서버가 항목별 최대값으로 자동 계산하므로 받지 않는다.
// 결과화면 「채무 상세」모달(DebtHistoryCard만 재사용, 채무발생 원인 UI가 없음)도 이 함수를
// 그대로 써서 자기 화면에 없는 필드를 요구하지 않도록 한다 — 채무발생 원인은 별도로 검사한다.
//
// 대출일·만기일·금액·금리(getMissingDebtItemFieldLabels)는 일부러 여기 포함하지 않는다.
// 이 함수는 isDiagnosisFormComplete → canAnalyze로 이어져 "분석하기" 버튼의 disabled를
// 직접 결정하는데, 새 행은 항상 이 4개가 비어있는 상태로 시작해서(createEmptyDebtItem)
// 포함시키면 버튼이 계속 비활성 상태에 갇혀 클릭 자체가 막히고, 그 안에서 modal을 띄우거나
// 셀을 빨갛게 표시하는 로직에 도달할 수조차 없게 된다. 대신 handleAnalyze 안에서
// canAnalyze 통과 후 별도로 검사해 모달+빨간 테두리를 띄운다(담보부채무 초과 검사와 동일한 방식).
export function getMissingDebtFieldLabels(form: DiagnosisFormState): string[] {
  const missing: string[] = [];
  if (form.debtInputMode === "detailed") {
    if (form.debts.length === 0) missing.push("채무 항목");
    if (form.debts.some((debt) => !debt.creditorName.trim())) missing.push("채권처");
  } else {
    if (form.debtTypes.length === 0) missing.push("채무종류");
    // 0(연체 없음)은 유효한 입력이라 null만 미입력으로 판정한다.
    if (form.overdueMonths === null) missing.push("연체기간");
  }
  return missing;
}

/** 상세모드 채무 항목들 중 대출일·만기일·금액·금리가 비어있는 게 있으면 그 라벨들(중복 제거). */
export function getMissingDebtItemFieldLabels(form: DiagnosisFormState): string[] {
  if (form.debtInputMode !== "detailed") return [];
  const missingItemFields = new Set<MissingDebtItemField>();
  form.debts.forEach((debt) => {
    getMissingDebtItemFields(debt).forEach((field) => missingItemFields.add(field));
  });
  return Array.from(missingItemFields, (field) => MISSING_DEBT_ITEM_FIELD_LABELS[field]);
}

// 실 API(POST /v1/analysis)가 필수로 요구하는 항목. 폼에서 null/빈 값일 수 있는 것만 검사한다.
// 토글(boolean)과 부동산 "없음"(빈 배열)은 기본값 자체가 유효한 상태라 여기서 검사하지 않는다.
export function getMissingRequiredFieldLabels(form: DiagnosisFormState): string[] {
  const missing: string[] = [];
  if (!form.customerName.trim()) missing.push("고객명");
  if (!form.gender) missing.push("성별");
  if (!form.ageGroup) missing.push("연령대");
  if (!form.region) missing.push("거주 지역");
  if (!form.employmentType) missing.push("고용 형태");
  if (!form.housingType) missing.push("주거 형태");
  if (form.dependents === null) missing.push("부양가족");
  if (form.spouseIncome === null) missing.push("배우자 소득");
  missing.push(...getMissingDebtFieldLabels(form));
  // 채권자 수(간편모드 전용)는 DebtHistoryCard 밖(Step3Debts)에서 입력받는 필드라 채무발생
  // 원인과 같은 방식으로 여기서 별도 검사한다 — getMissingDebtFieldLabels에 넣으면 이 함수를
  // 공유하는 결과화면 「채무 상세」 모달(DebtDetailModal, creditorCount 입력 UI 없음)까지
  // 막혀버린다.
  if (form.debtInputMode !== "detailed" && !form.creditorCount) missing.push("채권자 수");
  if (form.debtCauses.length === 0) missing.push("채무발생 원인");
  return missing;
}

/** 현재 스텝에서 "다음"으로 넘어가기 전에 채워야 하는 필수 항목 (생성 플로우용) */
export function getMissingRequiredFieldLabelsForStep(
  form: DiagnosisFormState,
  stepKey: FormStepKey
): string[] {
  switch (stepKey) {
    case "basic": {
      const missing: string[] = [];
      if (!form.customerName.trim()) missing.push("고객명");
      if (!form.gender) missing.push("성별");
      if (!form.ageGroup) missing.push("연령대");
      if (!form.region) missing.push("거주 지역");
      return missing;
    }
    case "assets":
      // 금융 자산/차량 가액은 null(미선택)·0(미보유 명시)을 구분한다. 스텝 필수 검사는 없음.
      return [];
    case "debts": {
      const missing = getMissingDebtFieldLabels(form);
      if (form.debtInputMode !== "detailed" && !form.creditorCount) missing.push("채권자 수");
      if (form.debtCauses.length === 0) missing.push("채무발생 원인");
      return missing;
    }
    case "income": {
      // 2026-08-07: 부양가족/배우자 소득 UI가 기본정보(Step1)에서 이 스텝으로 이동
      // (법정 생계비 계산의 가구원수 입력과 같은 화면에 두는 게 자연스러워서).
      const missing: string[] = [];
      if (!form.employmentType) missing.push("고용 형태");
      if (!form.housingType) missing.push("주거 형태");
      if (form.dependents === null) missing.push("부양가족");
      if (form.spouseIncome === null) missing.push("배우자 소득");
      return missing;
    }
    case "others":
      // 기타사항 필드는 기본값이 있어 스텝 단위 필수 검사 없음
      return [];
  }
}

/** 담보부채무·최근 3개월/6개월/1년 내 채무액 합이 총 채무 합계(채무종류별 금액 합)를 넘는지 검사 */
export function isRecentAndSecuredDebtOverTotal(
  form: DiagnosisFormState,
  totalDebtManwon: number
): boolean {
  const sum =
    form.securedDebt +
    form.recentDebtWithin3Months +
    form.recentDebtWithin6Months +
    form.recentDebtWithin1Year;
  return sum > totalDebtManwon;
}

export type OverLimitDebtField =
  | "securedDebt"
  | "recentDebtWithin3Months"
  | "recentDebtWithin6Months"
  | "recentDebtWithin1Year";

/**
 * 합계 초과 시 어떤 필드가 원인인지 최대한 특정한다. 한 필드의 값만으로도 총 채무를 넘는다면
 * (다른 두 필드가 0이어도 초과) 그 필드가 명백한 원인이므로 해당 필드만 반환한다.
 * 여러 필드가 함께 더해져야만 초과하는 조합이면 수학적으로 "범인"을 특정할 수 없으므로
 * 세 필드 모두 반환한다(기존 동작 유지). 초과하지 않으면 빈 배열.
 */
export function getOverLimitDebtFields(
  form: DiagnosisFormState,
  totalDebtManwon: number
): OverLimitDebtField[] {
  if (!isRecentAndSecuredDebtOverTotal(form, totalDebtManwon)) return [];

  const fields: { key: OverLimitDebtField; value: number }[] = [
    { key: "securedDebt", value: form.securedDebt },
    { key: "recentDebtWithin3Months", value: form.recentDebtWithin3Months },
    { key: "recentDebtWithin6Months", value: form.recentDebtWithin6Months },
    { key: "recentDebtWithin1Year", value: form.recentDebtWithin1Year },
  ];
  const individuallyOverLimit = fields
    .filter((field) => field.value > totalDebtManwon)
    .map((field) => field.key);

  return individuallyOverLimit.length > 0 ? individuallyOverLimit : fields.map((field) => field.key);
}

export function isDiagnosisFormComplete(form: DiagnosisFormState): boolean {
  return getMissingRequiredFieldLabels(form).length === 0;
}

export function isDiagnosisStepComplete(form: DiagnosisFormState, stepKey: FormStepKey): boolean {
  return getMissingRequiredFieldLabelsForStep(form, stepKey).length === 0;
}

/** 수정 모드: 불러온 원본과 현재 폼이 다른지. */
export function isDiagnosisFormDirty(
  current: DiagnosisFormState,
  baseline: DiagnosisFormState | null
): boolean {
  if (!baseline) return false;
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
