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
  /** 실제 고객 레코드와 연동된 데이터면 이름 옆에 연동 아이콘을 붙인다. */
  isCustomerConnected?: boolean;
  linkedCustomerName?: string;
  linkedCustomerContact?: string;
  onCustomerLink?: () => void;
  onCustomerUnlink?: () => void;
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
  isCustomerConnected = false,
  linkedCustomerName,
  linkedCustomerContact,
  onCustomerLink,
  onCustomerUnlink,
}: Props) {
  return (
    <aside className="hidden lg:flex lg:w-[286px] shrink-0 flex-col surface lg:rounded-[14px] pt-4 pb-8 px-[28px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
      <FormCustomerSummary
        form={form}
        isCustomerConnected={isCustomerConnected}
        linkedCustomerName={linkedCustomerName}
        linkedCustomerContact={linkedCustomerContact}
        onCustomerLink={onCustomerLink}
        onCustomerUnlink={onCustomerUnlink}
      />

      {/* Figma: 고객 블록 아래 24px → 풀폭 Divider */}
      <FullBleedDivider className="mt-6" />

      {/* Figma: Divider → 재무요약 29px ≈ 28px */}
      <div className="mt-7">
        <FormFinancialSummary derived={derived} />
      </div>

      {/* Figma: 재무요약 → 메뉴 28px, 메뉴 gap 4px / item 48px */}
      <div className="mt-7">
        <FormStepChecklist
          steps={steps}
          currentIndex={currentIndex}
          onSelectStep={onSelectStep}
          form={form}
        />
      </div>
    </aside>
  );
}
