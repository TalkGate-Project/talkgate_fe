import type { DiagnosisDerivedValues, DiagnosisFormState } from "@/types/debtRelief";
import type { FormStepMeta } from "./steps";
import FormCustomerSummary from "./FormCustomerSummary";
import FormFinancialSummary from "./FormFinancialSummary";
import FormStepChecklist from "./FormStepChecklist";

type Props = {
  form: DiagnosisFormState;
  derived: DiagnosisDerivedValues;
  steps: FormStepMeta[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  /** 필수값 미충족(생성) / 변경 없음(수정)이면 true — 분석하기 비활성 */
  analyzeDisabled?: boolean;
};

/** Figma: 구분선은 사이드바(286px) 좌우 끝까지 — 콘텐츠 패딩(28px)을 무시하고 bleed */
function FullBleedDivider({ className = "" }: { className?: string }) {
  return (
    <div
      role="separator"
      className={`-mx-[28px] h-px bg-neutral-30 opacity-50 ${className}`}
    />
  );
}

export default function FormSidebar({
  form,
  derived,
  steps,
  currentIndex,
  onSelectStep,
  onAnalyze,
  analyzing,
  analyzeDisabled = false,
}: Props) {
  const disabled = analyzing || analyzeDisabled;

  return (
    <aside className="hidden md:flex md:w-[286px] shrink-0 flex-col surface md:rounded-[14px] pt-6 pb-8 px-[28px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
      {/* 고객 요약 — 등록 단계에서는 고객 연결을 하지 않는 워크플로로 바뀌어 연결 버튼 제거 */}
      <FormCustomerSummary form={form} />

      {/* Figma: 고객 블록 아래 24px → 풀폭 Divider */}
      <FullBleedDivider className="mt-6" />

      {/* Figma: Divider → 재무요약 29px ≈ 28px */}
      <div className="mt-7">
        <FormFinancialSummary derived={derived} />
      </div>

      {/* Figma: 재무요약 → 메뉴 28px, 메뉴 gap 4px / item 48px */}
      <div className="mt-7">
        <FormStepChecklist steps={steps} currentIndex={currentIndex} onSelectStep={onSelectStep} />
      </div>

      {/* Figma: 메뉴 → Divider 16px */}
      <FullBleedDivider className="mt-4" />

      {/* Figma: Divider → 분석하기 27px ≈ 28px, 버튼 230×44 */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={disabled}
        aria-label={analyzing ? "분석 중" : "분석하기"}
        className="relative mt-7 cursor-pointer disabled:cursor-not-allowed w-full aspect-[488/116] rounded-[5px] bg-[url('/analyze-button.png')] bg-contain bg-center bg-no-repeat drop-shadow-[2px_2px_5px_#D6FAE8] disabled:opacity-40 transition-opacity hover:opacity-90"
      >
        {analyzing && (
          <span className="absolute inset-0 rounded-[5px] bg-card/85 grid place-items-center text-[14px] font-semibold text-ink">
            분석 중…
          </span>
        )}
      </button>
    </aside>
  );
}
