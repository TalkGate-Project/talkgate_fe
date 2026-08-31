import type { DebtItemFormState, DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepKey } from "./steps";

export type MissingDebtItemField = "loanDate" | "maturityDate" | "currentBalanceWon" | "interestRate";

const MISSING_DEBT_ITEM_FIELD_LABELS: Record<MissingDebtItemField, string> = {
  loanDate: "대출일",
  maturityDate: "만기일",
  currentBalanceWon: "현재 잔액",
  interestRate: "금리",
};

function isValidDateOnly(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * 상세모드 채무 항목 1건에서 비어있는 필드를 반환한다.
 * 연체(개월)는 0이 "연체 없음"이라는 유효한 기본값이라 여기서 검사하지 않는다.
 */
export function getMissingDebtItemFields(debt: DebtItemFormState): MissingDebtItemField[] {
  const missing: MissingDebtItemField[] = [];
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const loanDate = debt.loanDate ?? "";
  const maturityDate = debt.maturityDate ?? "";
  const validLoanDate = isValidDateOnly(loanDate);
  const validMaturityDate = isValidDateOnly(maturityDate);
  if (!validLoanDate || loanDate > todayText) missing.push("loanDate");
  if (!validMaturityDate || maturityDate <= todayText || (validLoanDate && maturityDate <= loanDate)) {
    missing.push("maturityDate");
  }
  if (!debt.currentBalanceWon) missing.push("currentBalanceWon");
  // 0% 무이자 대출은 유효하다. undefined만 미입력으로 구분한다.
  if (debt.interestRate == null) missing.push("interestRate");
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
  if (form.debts.length === 0) missing.push("채무 항목");
  if (form.debts.some((debt) => !debt.creditorName.trim())) missing.push("채권처");
  if (form.debts.some((debt) => !debt.currentBalanceWon)) missing.push("현재 잔액");
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
// 부동산 "없음"(빈 배열)은 명시 선택 여부를 realEstateStatusConfirmed로 따로 검사한다.
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
  if (!form.realEstateStatusConfirmed) missing.push("부동산 보유 여부");
  if (form.hasSpouseHousingAsset === null) missing.push("배우자 명의 주택 또는 전세보증금 보유 여부");
  if (form.hasSpouseHousingAsset && form.spouseHousingAssetValue <= 0) {
    missing.push("배우자 명의 주택 또는 전세보증금 가액");
  }
  if (form.hasRecentAssetDisposal === null) missing.push("최근 2년 내 재산 처분 이력");
  missing.push(...getMissingDebtFieldLabels(form));
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
    case "assets": {
      const missing: string[] = [];
      if (!form.realEstateStatusConfirmed) missing.push("부동산 보유 여부");
      if (form.hasSpouseHousingAsset === null) missing.push("배우자 명의 주택 또는 전세보증금 보유 여부");
      if (form.hasSpouseHousingAsset && form.spouseHousingAssetValue <= 0) {
        missing.push("배우자 명의 주택 또는 전세보증금 가액");
      }
      if (form.hasRecentAssetDisposal === null) missing.push("최근 2년 내 재산 처분 이력");
      // 금융 자산/차량 가액은 null(미선택)·0(미보유 명시)을 구분해 null만 미입력으로 판정한다.
      return missing;
    }
    case "debts": {
      const missing = getMissingDebtFieldLabels(form);
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

/** 담보부채무·최근 3개월/6개월/1년 내 채무액 합이 총 채무 합계(채무종류별 금액 합)를 넘는지 검사.
 * 이 4개 필드는 간편모드 전용이라 상세모드에서는 검사하지 않는다(폼에 남아있는 과거 간편모드
 * 값 때문에 상세모드에서 오탐이 뜨는 걸 방지). */
export function isRecentAndSecuredDebtOverTotal(
  form: DiagnosisFormState,
  totalDebtManwon: number
): boolean {
  if (form.debtInputMode === "detailed") return false;
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

// 좌측 네비게이터 체크(v) 표시 전용. getMissingRequiredFieldLabelsForStep는 "다음" 버튼 게이트와
// 공유하는 함수라 상세모드 채무 항목 필드(대출일·만기일·금리)를 일부러 검사하지 않는데(48-53줄 주석 참고),
// 체크리스트는 실제 완료 여부를 보여줘야 하므로 debts 스텝에서만 그 필드들도 함께 확인한다.
export function isDiagnosisStepComplete(form: DiagnosisFormState, stepKey: FormStepKey): boolean {
  // 자산 현황의 사이드바 체크는 하단의 두 필수 질문에 답했는지만 보여준다.
  // 보유 자산 입력 여부와 배우자 자산 가액은 다음 단계/최종 제출 검증에서 별도로 확인한다.
  if (stepKey === "assets") {
    return form.hasSpouseHousingAsset !== null && form.hasRecentAssetDisposal !== null;
  }
  if (getMissingRequiredFieldLabelsForStep(form, stepKey).length > 0) return false;
  if (stepKey === "debts") return getMissingDebtItemFieldLabels(form).length === 0;
  return true;
}

/** 수정 모드: 불러온 원본과 현재 폼이 다른지. */
export function isDiagnosisFormDirty(
  current: DiagnosisFormState,
  baseline: DiagnosisFormState | null
): boolean {
  if (!baseline) return false;
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
