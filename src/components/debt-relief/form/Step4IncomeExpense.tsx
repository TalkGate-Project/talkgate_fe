import {
  DEPENDENT_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  MONTHLY_INCOME_QUICK_PRESETS,
  SPOUSE_INCOME_OPTIONS,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, ManwonInput, ManwonQuickInput } from "./FormControls";
import { PillSelect } from "./PillSelect";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  derived: DiagnosisDerivedValues;
};

function signedManwon(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR")}만원`;
}

export default function Step4IncomeExpense({ form, update, derived }: Props) {
  const availableAmount = Math.abs(derived.monthlyAvailableIncomeManwon).toLocaleString("ko-KR");
  const availableNegative = derived.monthlyAvailableIncomeManwon < 0;

  return (
    <div>
      <FormSectionTitle>고객 소득/지출</FormSectionTitle>

      <div className="mt-0 lg:mt-3 flex flex-col gap-5">
        {/* 2026-07-24 피드백: 기본정보(Step1)에서 이 스텝으로 이동 */}
        <FormField label="고용 형태" required filled={form.employmentType !== null}>
          <PillSelect
            options={EMPLOYMENT_TYPE_OPTIONS}
            value={form.employmentType}
            onChange={(value) => update("employmentType", value)}
          />
        </FormField>

        <FormField label="월 소득 (세후 실수령 기준)" filled={form.monthlyIncome !== null}>
          <ManwonQuickInput
            value={form.monthlyIncome}
            onChange={(value) => update("monthlyIncome", value)}
            presets={MONTHLY_INCOME_QUICK_PRESETS}
          />
        </FormField>

        <FormField label="주거 형태" required filled={form.housingType !== null}>
          <PillSelect
            options={HOUSING_TYPE_OPTIONS}
            value={form.housingType}
            onChange={(value) => update("housingType", value)}
          />
        </FormField>

        {/* 2026-08-07 디자인 변경: 기본정보(Step1)에서 이 스텝으로 이동 — 법정 생계비 계산에
            쓰이는 가구원수 입력과 같은 화면에 있는 게 자연스러워서 */}
        <FormField label="부양가족" required filled={form.dependents !== null}>
          <PillSelect
            options={DEPENDENT_OPTIONS}
            value={form.dependents}
            onChange={(value) => update("dependents", value)}
          />
        </FormField>

        <FormField label="배우자 소득" required filled={form.spouseIncome !== null}>
          <PillSelect
            options={SPOUSE_INCOME_OPTIONS}
            value={form.spouseIncome === null ? null : form.spouseIncome ? "yes" : "none"}
            onChange={(value) => update("spouseIncome", value === null ? null : value === "yes")}
          />
        </FormField>

        {/* 월 가용 소득 계산 — Figma: 보더 박스, 1·2행 투명 / 3행만 Light-10, 행 h-40.
            부양가족을 아직 선택하지 않았으면 법정 생계비를 0으로 둔다 — 가구원 1인 기준
            실제값(-154만원)을 임의로 가정해 보여주면 아무것도 고르지 않았는데 마이너스가
            나오는 것처럼 보인다. "없음"을 명시적으로 선택하면 그때부터 실제 값을 반영한다. */}
        <div>
          <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground mb-3">
            월 가용 소득 (법원 인정 기준)
          </h3>
          <div className="rounded-lg border border-neutral-30 overflow-hidden bg-card">
            <div className="flex items-center justify-between px-4 h-10 border-b border-neutral-30">
              <span className="text-[14px] font-medium leading-4 tracking-[0.2px] text-neutral-60">
                월 소득
              </span>
              <span className="text-[14px] font-semibold leading-4 tracking-[0.2px] text-neutral-60">
                {signedManwon(derived.monthlyIncomeManwon)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 min-h-10 py-2 border-b border-neutral-30">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0 text-[14px] font-medium leading-4 tracking-[0.2px] text-neutral-60">
                <span className="shrink-0">법정 생계비</span>
                <span className="text-[12px] leading-4 text-neutral-50">
                  가구원 {derived.householdSize}인 기준
                </span>
              </span>
              <span className="shrink-0 text-[14px] font-semibold leading-4 tracking-[0.2px] text-neutral-60">
                {derived.minimumLivingCostManwon > 0 ? "-" : ""}
                {derived.minimumLivingCostManwon.toLocaleString("ko-KR")}만원
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 min-h-10 py-2 border-b border-neutral-30">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0 text-[14px] font-medium leading-4 tracking-[0.2px] text-neutral-60">
                <span className="shrink-0">추가 필수지출</span>
                <span className="text-[12px] leading-4 text-neutral-50">
                  주거비, 의료비 등 추가로 인정될 수 있는 필수 지출입니다.
                </span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[14px] font-semibold leading-4 tracking-[0.2px] text-neutral-60">
                  -
                </span>
                <ManwonInput
                  value={form.additionalFixedExpense}
                  onChange={(value) => update("additionalFixedExpense", value)}
                  suffixOutside
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 h-10 bg-neutral-10">
              <span className="text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground">
                월 가용 소득
              </span>
              <span className="flex items-end gap-1">
                <span className="font-montserrat font-bold text-[20px] leading-5 tracking-[-0.03em] text-neutral-90">
                  {availableNegative ? "-" : ""}
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
