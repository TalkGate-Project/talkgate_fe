import {
  CREDITOR_COUNT_OPTIONS,
  DEBT_AMOUNT_LABELS,
  DEBT_CAUSE_OPTIONS,
  DEBT_TYPE_OPTIONS,
  OVERDUE_PERIOD_OPTIONS,
  type DebtType,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, ManwonInput } from "./FormControls";
import { PillSelect, PillMultiSelect } from "./PillSelect";
import { FormToggleRow } from "./FormToggle";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  derived: DiagnosisDerivedValues;
};

function getDebtAmountFields(selectedTypes: DebtType[]): { key: DebtType; label: string }[] {
  return DEBT_TYPE_OPTIONS.filter((option) => selectedTypes.includes(option.value)).map(
    (option) => ({ key: option.value, label: DEBT_AMOUNT_LABELS[option.value] })
  );
}

export default function Step3Debts({ form, update, derived }: Props) {
  const setAmount = (type: DebtType, value: number) => {
    update("debtAmounts", { ...form.debtAmounts, [type]: value });
  };

  const handleDebtTypesChange = (nextTypes: DebtType[]) => {
    update("debtTypes", nextTypes);

    const pruned: Partial<Record<DebtType, number>> = {};
    nextTypes.forEach((type) => {
      if (form.debtAmounts[type] != null) pruned[type] = form.debtAmounts[type];
    });
    update("debtAmounts", pruned);
  };

  const amountFields = getDebtAmountFields(form.debtTypes);

  return (
    <div>
      <FormSectionTitle>고객 채무 현황</FormSectionTitle>

      <div className="mt-0 md:mt-3 flex flex-col gap-5">
        <FormField label="채무종류" hint="(중복선택 가능)">
          <PillMultiSelect
            options={DEBT_TYPE_OPTIONS}
            value={form.debtTypes}
            onChange={handleDebtTypesChange}
          />
        </FormField>

        {amountFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-4 md:gap-y-5">
            {amountFields.map((field) => (
              <FormField key={field.key} label={field.label}>
                <ManwonInput
                  value={form.debtAmounts[field.key] ?? 0}
                  onChange={(value) => setAmount(field.key, value)}
                />
              </FormField>
            ))}
          </div>
        )}

        {/* Figma: 금액 영역과 합계 사이 콘텐츠 폭 Divider */}
        <div role="separator" className="h-px bg-neutral-30" />

        {/* Figma: 총 채무 합계 — 모바일 h-48 px-16 / 데스크톱 h-56 px-28, radius 12, 숫자 Montserrat */}
        <div className="flex items-center justify-between bg-neutral-10 rounded-[12px] px-4 md:px-7 h-12 md:h-[56px]">
          <span className="text-[14px] font-medium tracking-[0.2px] text-neutral-60">총 채무 합계</span>
          <span className="flex items-end gap-1">
            <span className="font-montserrat font-bold text-[18px] md:text-[20px] leading-5 tracking-[-0.03em] text-neutral-90">
              {derived.totalDebtManwon.toLocaleString("ko-KR")}
            </span>
            <span className="text-[13px] font-semibold leading-4 text-neutral-60">만원</span>
          </span>
        </div>

        {/* Figma Frame: gap 20 — 채권자 수 → 연체기간 → 체납 토글 → 채무발생 원인 */}
        <div className="flex flex-col gap-5">
          <FormField label="채권자 수">
            <PillSelect
              options={CREDITOR_COUNT_OPTIONS}
              value={form.creditorCount}
              onChange={(value) => update("creditorCount", value)}
            />
          </FormField>

          <FormField label="연체기간">
            <PillSelect
              options={OVERDUE_PERIOD_OPTIONS}
              value={form.overduePeriod}
              onChange={(value) => update("overduePeriod", value)}
            />
          </FormField>

          <FormToggleRow
            label="세금/4대보험 체납이력 있음"
            checked={form.hasTaxArrears}
            onChange={(checked) => update("hasTaxArrears", checked)}
          />

          <FormField label="채무발생 원인" hint="(중복선택 가능)">
            <PillMultiSelect
              options={DEBT_CAUSE_OPTIONS}
              value={form.debtCauses}
              onChange={(value) => update("debtCauses", value)}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
