import type { DiagnosisDetail } from "@/types/debtRelief";

/** debtAdjustmentComparison 문자열의 **강조** 구간을 ExtraBold로 렌더 */
function renderComparisonText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={index} className="font-extrabold">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// trackingProcedure와 무관하게 참조할 값(debtAdjustmentComparison)이 있으면 노출한다.
export default function SectionDebtAdjustmentComparison({ detail }: { detail: DiagnosisDetail }) {
  if (!detail.debtAdjustmentComparison) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="inline-flex h-6 items-center text-[16px] font-semibold leading-none tracking-[0.2px] text-foreground">
          개인회생과 개인워크아웃 비교
        </h2>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      <div className="rounded-[12px] bg-neutral-10 px-5 py-4 md:px-8">
        <p className="whitespace-pre-line text-[14px] font-medium leading-5 tracking-[-0.02em] text-neutral-90">
          {renderComparisonText(detail.debtAdjustmentComparison)}
        </p>
      </div>
    </div>
  );
}
