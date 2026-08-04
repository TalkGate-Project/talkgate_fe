import type { DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepKey } from "./steps";

// 채무현황 스텝의 필수값은 입력 모드에 따라 달라진다.
// - 간편(simple): 채무종류 선택 + 연체기간 직접 입력
// - 상세(detailed): 채무 항목 1건 이상. 연체기간은 서버가 항목별 최대값으로 자동 계산하므로 받지 않는다.
function getMissingDebtFieldLabels(form: DiagnosisFormState): string[] {
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

// 실 API(POST /v1/analysis)가 필수로 요구하는 항목. 폼에서 null/빈 값일 수 있는 것만 검사한다.
// 토글(boolean)과 부동산 "없음"(빈 배열)은 기본값 자체가 유효한 상태라 여기서 검사하지 않는다.
export function getMissingRequiredFieldLabels(form: DiagnosisFormState): string[] {
  const missing: string[] = [];
  if (!form.customerName.trim()) missing.push("고객명");
  if (!form.gender) missing.push("성별");
  if (!form.ageGroup) missing.push("연령대");
  if (!form.region) missing.push("거주 지역");
  if (!form.employmentType) missing.push("고용 형태");
  if (form.dependents === null) missing.push("부양가족");
  if (form.spouseIncome === null) missing.push("배우자 소득");
  if (!form.monthlyIncome) missing.push("월 소득 구간");
  if (!form.housingType) missing.push("주거 형태");
  missing.push(...getMissingDebtFieldLabels(form));
  if (!form.financialAsset) missing.push("금융 자산");
  if (!form.vehicle) missing.push("차량 보유");
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
      if (form.dependents === null) missing.push("부양가족");
      if (form.spouseIncome === null) missing.push("배우자 소득");
      return missing;
    }
    case "assets": {
      const missing: string[] = [];
      if (!form.financialAsset) missing.push("금융 자산");
      if (!form.vehicle) missing.push("차량 보유");
      return missing;
    }
    case "debts":
      return getMissingDebtFieldLabels(form);
    case "income": {
      const missing: string[] = [];
      if (!form.employmentType) missing.push("고용 형태");
      if (!form.monthlyIncome) missing.push("월 소득 구간");
      if (!form.housingType) missing.push("주거 형태");
      return missing;
    }
    case "others":
      // 기타사항 필드는 기본값이 있어 스텝 단위 필수 검사 없음
      return [];
  }
}

/** 담보부채무·최근 3개월/1년 내 채무액 합이 총 채무 합계(채무종류별 금액 합)를 넘는지 검사 */
export function isRecentAndSecuredDebtOverTotal(
  form: DiagnosisFormState,
  totalDebtManwon: number
): boolean {
  const sum = form.securedDebt + form.recentDebtWithin3Months + form.recentDebtWithin1Year;
  return sum > totalDebtManwon;
}

export type OverLimitDebtField = "securedDebt" | "recentDebtWithin3Months" | "recentDebtWithin1Year";

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
