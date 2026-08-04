"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createEmptyDiagnosisForm,
  MONTHLY_INCOME_ESTIMATE,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { wonToManwon } from "@/services/debtRelief";

export function useDiagnosisForm() {
  const [form, setForm] = useState<DiagnosisFormState>(createEmptyDiagnosisForm);

  const update = useCallback(
    <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const derived: DiagnosisDerivedValues = useMemo(() => {
    // 총 채무는 입력 모드에 따라 원본이 다르다 — 간편은 종류별 잔액(만원), 상세는 항목별 원금(원).
    // 사이드바·요약 표기는 두 모드 모두 만원 기준으로 통일한다.
    let totalDebtManwon = 0;
    if (form.debtInputMode === "detailed") {
      totalDebtManwon = wonToManwon(
        form.debts.reduce((sum, debt) => sum + (debt.principalWon || 0), 0)
      );
    } else {
      for (const type of form.debtTypes) {
        totalDebtManwon += form.debtAmounts[type] ?? 0;
      }
    }

    const estimatedMonthlyIncomeManwon = form.monthlyIncome
      ? MONTHLY_INCOME_ESTIMATE[form.monthlyIncome]
      : 0;
    const totalExpenseManwon = Object.values(form.expenses).reduce(
      (sum, value) => sum + (value || 0),
      0
    );
    const monthlyAvailableIncomeManwon = estimatedMonthlyIncomeManwon - totalExpenseManwon;

    return {
      totalDebtManwon,
      estimatedMonthlyIncomeManwon,
      totalExpenseManwon,
      monthlyAvailableIncomeManwon,
    };
  }, [form]);

  return { form, setForm, update, derived };
}
