"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createEmptyDiagnosisForm,
  MONTHLY_INCOME_ESTIMATE,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";

export function useDiagnosisForm() {
  const [form, setForm] = useState<DiagnosisFormState>(createEmptyDiagnosisForm);

  const update = useCallback(
    <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const derived: DiagnosisDerivedValues = useMemo(() => {
    let totalDebtManwon = 0;
    for (const type of form.debtTypes) {
      totalDebtManwon += form.debtAmounts[type] ?? 0;
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
