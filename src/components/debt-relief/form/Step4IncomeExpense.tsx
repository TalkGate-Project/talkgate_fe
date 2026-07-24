import {
  EMPLOYMENT_TYPE_OPTIONS,
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

  const availableSign = derived.monthlyAvailableIncomeManwon >= 0 ? "+" : "";
  const availableAmount = Math.abs(derived.monthlyAvailableIncomeManwon).toLocaleString("ko-KR");
  const availableNegative = derived.monthlyAvailableIncomeManwon < 0;

  return (
    <div>
      <FormSectionTitle>고객 소득/지출</FormSectionTitle>

      <div className="mt-0 md:mt-3 flex flex-col gap-5">
        <FormField
          label="월 소득 (세후 실수령 기준)"
          required
          filled={form.monthlyIncome !== null}
        >
          <PillSelect
            options={MONTHLY_INCOME_OPTIONS}
            value={form.monthlyIncome}
            onChange={(value) => update("monthlyIncome", value)}
          />
        </FormField>

        {/* 2026-07-24 피드백: 기본정보(Step1)에서 이 스텝으로 이동 */}
        <FormField label="고용 형태" required filled={form.employmentType !== null}>
          <PillSelect
            options={EMPLOYMENT_TYPE_OPTIONS}
            value={form.employmentType}
            onChange={(value) => update("employmentType", value)}
          />
        </FormField>

        <FormField label="주거 형태" required filled={form.housingType !== null}>
          <PillSelect
            options={HOUSING_TYPE_OPTIONS}
            value={form.housingType}
            onChange={(value) => update("housingType", value)}
          />
        </FormField>

        <div>
          {/* Figma 모바일: 제목+안내 아래 구분선 (FormSectionTitle과 동일 패턴) */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-neutral-30 md:mb-3 md:border-0 md:pb-0">
            <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground">
              월 고정 지출<span className="md:hidden"> (만원)</span>
            </h3>
            <span className="text-[12px] text-neutral-50">*해당 없을 시 0원으로 입력</span>
          </div>
          {/* Figma: 모바일 2열 / 데스크톱 3열 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 md:gap-x-7 gap-y-4 md:gap-y-5">
            {EXPENSE_FIELDS.map((field) => (
              <FormField
                key={field.key}
                label={field.label}
                filled={form.expenses[field.key] > 0}
              >
                <ManwonInput
                  value={form.expenses[field.key]}
                  onChange={(value) => setExpense(field.key, value)}
                />
              </FormField>
            ))}
          </div>
        </div>

        {/* 월 가용 소득 계산 — Figma: 보더 박스, 1·2행 투명 / 3행만 Light-10, 행 h-40 */}
        <div>
          <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground mb-3">월 가용 소득</h3>
          <div className="rounded-lg border border-neutral-30 overflow-hidden bg-card">
            <div className="flex items-center justify-between px-4 h-10 border-b border-neutral-30">
              <span className="text-[14px] font-medium leading-4 tracking-[0.2px] text-neutral-60">
                월 소득 (추정)
              </span>
              <span className="text-[14px] font-semibold leading-4 tracking-[0.2px] text-neutral-60">
                {signedManwon(derived.estimatedMonthlyIncomeManwon)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 h-10 border-b border-neutral-30">
              <span className="text-[14px] font-medium leading-4 tracking-[0.2px] text-neutral-60">총 지출</span>
              <span className="text-[14px] font-semibold leading-4 tracking-[0.2px] text-neutral-60">
                -{derived.totalExpenseManwon.toLocaleString("ko-KR")}만원
              </span>
            </div>
            <div className="flex items-center justify-between px-4 h-10 bg-neutral-10">
              <span className="text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground">
                월 가용 소득
              </span>
              <span className="flex items-end gap-1">
                <span
                  className={`font-montserrat font-bold text-[20px] leading-5 tracking-[-0.03em] ${
                    availableNegative ? "text-danger-40" : "text-neutral-90"
                  }`}
                >
                  {availableNegative ? "-" : availableSign}
                  {availableAmount}
                </span>
                <span className="text-[13px] font-semibold leading-4 text-neutral-60">만원</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
