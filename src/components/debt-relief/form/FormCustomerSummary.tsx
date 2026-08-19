import {
  AGE_GROUP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import LinkIcon from "@/components/icons/LinkIcon";

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
    optionLabel(EMPLOYMENT_TYPE_OPTIONS, form.employmentType) || "무직",
  ].filter(Boolean);
  return parts.join(" · ");
}

// FormSidebar(데스크톱)와 MobileFormSummaryDrawer(모바일)가 공유하는 고객 요약 행
export default function FormCustomerSummary({
  form,
  isCustomerConnected = false,
  onCustomerLink,
  onCustomerUnlink,
}: {
  form: DiagnosisFormState;
  /** 실제 고객 레코드와 연동된 데이터면 이름 옆에 연동 아이콘을 붙인다. */
  isCustomerConnected?: boolean;
  onCustomerLink?: () => void;
  onCustomerUnlink?: () => void;
}) {
  const meta = buildCustomerMeta(form);

  return (
    <div className="flex min-w-0 items-start justify-between gap-3 text-left">
      <div className="min-w-0">
        <p className="flex items-center gap-1 min-w-0">
          <span className="text-[18px] font-bold leading-[21px] text-ink truncate">
            {form.customerName || "고객명"}
          </span>
          {isCustomerConnected && <LinkIcon className="shrink-0 text-[#2563EB]" />}
        </p>
        {meta && <p className="text-[14px] font-medium leading-5 text-neutral-60 truncate">{meta}</p>}
      </div>
      {onCustomerLink && (
        <div className="shrink-0 flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={onCustomerLink}
            className={`inline-flex h-[34px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[5px] border px-3 text-[13px] font-semibold ${
              isCustomerConnected
                ? "border-secondary-60 bg-secondary-10 text-secondary-60 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                : "border-neutral-30 bg-card text-foreground hover:bg-neutral-10"
            }`}
          >
            <LinkIcon className="shrink-0" />
            {isCustomerConnected ? "고객 연동됨 · 변경" : "고객 연동"}
          </button>
          {isCustomerConnected && onCustomerUnlink && (
            <button
              type="button"
              onClick={onCustomerUnlink}
              className="cursor-pointer text-[12px] font-medium text-neutral-50 hover:text-neutral-70 hover:underline"
            >
              연동 해제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
