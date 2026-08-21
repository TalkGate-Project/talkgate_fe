"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createEmptyDiagnosisForm,
  resolveCourtMinimumLivingCostWon,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { manwonToWon, resolveHouseholdSize, wonToManwon } from "@/services/debtRelief";

export function useDiagnosisForm() {
  const [form, setForm] = useState<DiagnosisFormState>(createEmptyDiagnosisForm);

  const update = useCallback(
    <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const derived: DiagnosisDerivedValues = useMemo(() => {
    // 간편·상세 모드 모두 현재 채무 입력 UI(DebtItemsTable)는 form.debts에만 기록한다.
    // debtTypes/debtAmounts는 서버에서 기존 분석을 불러올 때만 채워지는 레거시 스냅숏이라
    // 폼에서 채무를 추가·수정해도 갱신되지 않는다 — 이 값으로 합산하면 간편 모드 신규 진단은
    // 항상 0원으로 계산돼 "분석하기"가 막힌다. 두 모드 모두 form.debts 기준으로 통일한다.
    const totalDebtManwon = wonToManwon(
      form.debts.reduce((sum, debt) => sum + (debt.currentBalanceWon || 0), 0)
    );

    // 법원 인정 기준 월 가용소득 = 월소득 − 가구원수별 법원 인정 최저생계비 − 추가 인정 고정지출
    // (서버 disposableIncome과 동일 공식 — 2026-08-07 스펙). 원 단위로 계산 후 만원으로 환산해
    // 중간 반올림 오차를 줄인다.
    // 부양가족을 아직 선택하지 않았으면(null) 아무것도 확정되지 않은 상태이므로, 가구원 1인
    // 기준값을 임의로 가정해 마이너스로 보여주지 않고 최저생계비를 0으로 둔다. "없음"을
    // 명시적으로 선택하면(dependents="0") 그때부터 가구원 1인 기준 실제 값을 반영한다.
    const householdSize = resolveHouseholdSize(form.dependents);
    const minimumLivingCostWon =
      form.dependents === null ? 0 : resolveCourtMinimumLivingCostWon(householdSize);
    const minimumLivingCostManwon = wonToManwon(minimumLivingCostWon);
    const monthlyAvailableIncomeWon =
      manwonToWon(form.monthlyIncome ?? 0) -
      minimumLivingCostWon -
      manwonToWon(form.additionalFixedExpense);
    const monthlyAvailableIncomeManwon = wonToManwon(monthlyAvailableIncomeWon);

    return {
      totalDebtManwon,
      monthlyIncomeManwon: form.monthlyIncome ?? 0,
      minimumLivingCostManwon,
      householdSize,
      monthlyAvailableIncomeManwon,
    };
  }, [form]);

  return { form, setForm, update, derived };
}
