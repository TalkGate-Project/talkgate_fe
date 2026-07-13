import type { DiagnosisDetail, RepaymentPlan } from "@/types/debtRelief";
import { formatManwonComma } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-medium leading-[17px] text-neutral-60">{label}</span>
      <span className="text-[14px] font-semibold leading-[17px] text-foreground">{value}</span>
    </div>
  );
}

/** notes 문자열의 **강조** 구간을 ExtraBold로 렌더 */
function renderNote(note: string) {
  const parts = note.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span
          key={index}
          className="font-extrabold text-[13px] leading-[28px] tracking-[-0.02em] text-neutral-70"
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function SectionRepaymentPlan({ detail }: { detail: DiagnosisDetail }) {
  const plan: RepaymentPlan = detail.repaymentPlan;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-1">
          <h2 className="inline-flex h-6 items-center text-[16px] font-semibold leading-none tracking-[0.2px] text-foreground">
            예상 변제 계획
          </h2>
          <DisclaimerInfoTooltip label="예상 변제 계획 안내">
            아래 금액·기간은 예상 시뮬레이션이며, 실제 인가·면책 범위는
            <br />
            법원 결정에 따라 달라질 수 있습니다.
          </DisclaimerInfoTooltip>
        </div>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      <div className="flex flex-col lg:flex-row gap-7 lg:gap-8">
        {/* 좌: 변제 요약 + 예상 면책 채무 */}
        <div className="flex flex-col gap-4 w-full lg:w-[620px] lg:shrink-0">
          <div className="rounded-[12px] border border-neutral-30 px-5 md:px-8 py-[17px] flex flex-col gap-4">
            <PlanRow label="월 변제액" value={formatManwonComma(plan.monthlyPaymentManwon)} />
            <PlanRow label="변제 기간" value={`${plan.months}개월 (${plan.years}년)`} />
            <PlanRow label="총 변제액" value={formatManwonComma(plan.totalPaymentManwon)} />
          </div>

          <div className="rounded-[12px] bg-neutral-10 px-5 md:px-8 py-4 flex flex-col gap-2.5">
            <p className="text-[14px] font-medium leading-[17px] text-neutral-60">예상 면책 채무</p>
            <p className="font-montserrat font-bold text-[28px] leading-7 tracking-[-0.03em] text-neutral-90">
              약 {formatManwonComma(plan.exemptedDebtManwon)}
            </p>
            <p className="text-[14px] font-medium leading-[17px] text-neutral-60">
              변제 완료 후 법원 결정으로 면책되는 잔여 채무 금액입니다.
            </p>
          </div>
        </div>

        {/* 우: 주의사항 */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60 mb-[12px]">주의사항</p>
          <ul className="flex flex-col">
            {plan.notes.map((note, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-[13px] font-medium leading-[28px] tracking-[-0.02em] text-neutral-70"
              >
                <span className="mt-[11px] w-1 h-1 rounded-full bg-neutral-50 shrink-0" aria-hidden />
                <span>{renderNote(note)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
