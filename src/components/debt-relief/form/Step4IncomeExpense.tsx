import {
  HOUSING_TYPE_OPTIONS,
  MONTHLY_INCOME_OPTIONS,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
  type MonthlyExpenses,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, ManwonInput } from "./FormControls";
import { PillSelect } from "./PillSelect";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  derived: DiagnosisDerivedValues;
};

const EXPENSE_FIELDS: { key: keyof MonthlyExpenses; label: string }[] = [
  { key: "housing", label: "주거비" },
  { key: "food", label: "식비" },
  { key: "education", label: "교육비" },
  { key: "transportation", label: "교통비" },
  { key: "other", label: "기타 고정지출" },
];

function signedManwon(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR")}만원`;
}

export default function Step4IncomeExpense({ form, update, derived }: Props) {
  const setExpense = (key: keyof MonthlyExpenses, value: number) => {
    update("expenses", { ...form.expenses, [key]: value });
  };

  return (
    <div>
      <FormSectionTitle>고객 소득/지출</FormSectionTitle>

      <div className="mt-3 flex flex-col gap-5">
        <FormField label="월 소득 (세후 실수령 기준)">
          <PillSelect
            options={MONTHLY_INCOME_OPTIONS}
            value={form.monthlyIncome}
            onChange={(value) => update("monthlyIncome", value)}
          />
        </FormField>

        <FormField label="주거 형태">
          <PillSelect
            options={HOUSING_TYPE_OPTIONS}
            value={form.housingType}
            onChange={(value) => update("housingType", value)}
          />
        </FormField>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground">월 고정 지출</h3>
            <span className="text-[12px] text-neutral-50">*해당 없을 시 0원으로 입력</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {EXPENSE_FIELDS.map((field) => (
              <FormField key={field.key} label={field.label}>
                <ManwonInput
                  value={form.expenses[field.key]}
                  onChange={(value) => setExpense(field.key, value)}
                />
              </FormField>
            ))}
          </div>
        </div>

        {/* 월 가용 소득 계산 */}
        <div>
          <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground mb-3">월 가용 소득</h3>
          <div className="bg-neutral-10 rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 h-[52px] border-b border-neutral-20">
              <span className="text-[14px] text-neutral-60">월 소득 (추정)</span>
              <span className="text-[14px] text-foreground">
                {signedManwon(derived.estimatedMonthlyIncomeManwon)}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 h-[52px] border-b border-neutral-20">
              <span className="text-[14px] text-neutral-60">총 지출</span>
              <span className="text-[14px] text-foreground">
                -{derived.totalExpenseManwon.toLocaleString("ko-KR")}만원
              </span>
            </div>
            <div className="flex items-center justify-between px-5 h-[56px]">
              <span className="text-[15px] font-semibold text-foreground">월 가용 소득</span>
              <span
                className={`text-[16px] font-bold ${
                  derived.monthlyAvailableIncomeManwon < 0 ? "text-danger-40" : "text-foreground"
                }`}
              >
                {signedManwon(derived.monthlyAvailableIncomeManwon)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
