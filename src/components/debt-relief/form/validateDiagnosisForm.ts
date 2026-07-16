import type { DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepKey } from "./steps";

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
      if (!form.ageGroup) missing.push("연령대");
      if (!form.region) missing.push("거주 지역");
      if (!form.employmentType) missing.push("고용 형태");
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
