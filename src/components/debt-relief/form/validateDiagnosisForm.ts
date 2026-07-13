import type { DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepKey } from "./steps";

// 실 API(POST /v1/analysis)가 필수로 요구하지만, 폼에서는 사용자가 아직 선택하지 않았을 때
// null일 수 있는 항목만 검사한다. (customerName/ageGroup/region/employmentType/dependents/
// spouseIncome/hasPreviousApplication/hasGuarantor/hasOngoingLitigation은 항상 기본값이
// 채워져 있어 null이 될 수 없다. 부동산은 realEstateBreakdown이 항목별 금액 입력이라
// "선택 안 함" 자체가 유효한 상태 — 여기서 검사하지 않는다.)
export function getMissingRequiredFieldLabels(form: DiagnosisFormState): string[] {
  const missing: string[] = [];
  if (!form.customerName.trim()) missing.push("고객명");
  if (!form.gender) missing.push("성별");
  if (!form.monthlyIncome) missing.push("월 소득 구간");
  if (!form.housingType) missing.push("주거 형태");
  if (!form.overduePeriod) missing.push("연체기간");
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
      return missing;
    }
    case "assets": {
      const missing: string[] = [];
      if (!form.financialAsset) missing.push("금융 자산");
      if (!form.vehicle) missing.push("차량 보유");
      return missing;
    }
    case "debts": {
      const missing: string[] = [];
      if (!form.overduePeriod) missing.push("연체기간");
      return missing;
    }
    case "income": {
      const missing: string[] = [];
      if (!form.monthlyIncome) missing.push("월 소득 구간");
      if (!form.housingType) missing.push("주거 형태");
      return missing;
    }
    case "others":
      // 기타사항 필드는 기본값이 있어 스텝 단위 필수 검사 없음
      return [];
  }
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
