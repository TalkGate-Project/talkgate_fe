import {
  AGE_GROUP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  type DiagnosisFormState,
} from "@/types/debtRelief";

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | null
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? null;
}

export function buildCustomerMeta(form: DiagnosisFormState): string {
  const parts = [
    optionLabel(AGE_GROUP_OPTIONS, form.ageGroup),
    form.gender ? (form.gender === "male" ? "남" : "여") : null,
    optionLabel(EMPLOYMENT_TYPE_OPTIONS, form.employmentType),
  ].filter(Boolean);
  return parts.join(" · ");
}

// FormSidebar(데스크톱)와 MobileFormSummaryDrawer(모바일)가 공유하는 고객 요약 행
export default function FormCustomerSummary({ form }: { form: DiagnosisFormState }) {
  const meta = buildCustomerMeta(form);

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-full bg-primary-10 text-primary-60 grid place-items-center text-[14px] font-semibold shrink-0">
        {form.customerName ? form.customerName.charAt(0) : "고"}
      </div>
      <div className="min-w-0">
        <p className="text-[18px] font-bold leading-[21px] text-ink truncate">
          {form.customerName || "고객명"}
        </p>
        {meta && <p className="text-[14px] font-medium leading-5 text-neutral-60 truncate">{meta}</p>}
      </div>
    </div>
  );
}
