import type { DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepMeta } from "./steps";
import { isDiagnosisStepComplete } from "./validateDiagnosisForm";

// Icon/Solid/check-circle
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        fill="currentColor"
      />
    </svg>
  );
}

type Props = {
  steps: FormStepMeta[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
  form: DiagnosisFormState;
};

// FormSidebar(데스크톱)와 MobileFormSummaryDrawer(모바일)가 공유하는 단계 체크리스트
// v 체크는 "현재 보고 있음"이 아니라, 해당 단계 필수값 입력 + validation 통과 시에만 표시
export default function FormStepChecklist({ steps, currentIndex, onSelectStep, form }: Props) {
  return (
    <nav className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        // 기타사항은 필수값이 없어 완료 판정이 항상 true가 되므로, 체크리스트에서는 v를 표시하지 않는다.
        const isComplete =
          step.key !== "others" && isDiagnosisStepComplete(form, step.key);

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelectStep(index)}
            className={`cursor-pointer flex items-center gap-4 h-12 px-3 rounded-[8px] transition-colors ${
              isActive
                ? "bg-neutral-90 text-neutral-20 text-[16px] font-bold"
                : "text-ink text-[14px] font-medium hover:bg-neutral-10"
            }`}
          >
            {isComplete ? (
              <CheckCircleIcon className={`shrink-0 ${isActive ? "text-neutral-20" : "text-neutral-90"}`} />
            ) : (
              <span
                className={`w-5 h-5 rounded-full grid place-items-center shrink-0 text-[12px] font-semibold ${
                  isActive ? "bg-neutral-20 text-neutral-90" : "bg-neutral-20 text-neutral-70"
                }`}
              >
                {index + 1}
              </span>
            )}
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}
