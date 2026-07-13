"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CAPITAL_DEBT_TYPES,
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
    // 캐피탈·저축은행은 금액을 capital 키 하나에만 두므로 중복 합산을 피한다.
    let totalDebtManwon = 0;
    let capitalCounted = false;
    for (const type of form.debtTypes) {
      if (CAPITAL_DEBT_TYPES.includes(type)) {
        if (!capitalCounted) {
          totalDebtManwon += form.debtAmounts.capital ?? 0;
          capitalCounted = true;
        }
        continue;
      }
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
