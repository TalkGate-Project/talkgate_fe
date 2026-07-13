import {
  RECOMMENDED_PROCEDURE_LABEL,
  getProgressStepMeta,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import { formatDebtManwonParts } from "@/components/debt-relief/format";

// 추천 절차 배지 색상 (피그마: 개인회생=Primary, 채무조정=Warning, 파산=Danger)
const PROCEDURE_BADGE_STYLE: Record<RecommendedProcedure, string> = {
  individual_rehab: "bg-primary-10 text-primary-80",
  debt_adjustment: "bg-warning-10 text-warning-60",
  bankruptcy: "bg-danger-10 text-danger-40",
};

export function ProcedureBadge({ procedure }: { procedure: RecommendedProcedure }) {
  return (
    <span
      className={`inline-flex items-center h-[22px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap ${PROCEDURE_BADGE_STYLE[procedure]}`}
    >
      {RECOMMENDED_PROCEDURE_LABEL[procedure]}
    </span>
  );
}

// 성공 가능성: "78/100" — 강조(점수) 16px/600, 보조(/100) 10px/500
export function SuccessProbabilityText({ value }: { value: number }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span className="text-[16px] font-semibold leading-none text-neutral-90">{score}</span>
      <span className="text-[10px] font-medium leading-[12px] tracking-[-0.02em] text-neutral-60">
        /100
      </span>
    </span>
  );
}

// 총 채무: "51억" 강조(16px/600) + "원" 보조(14px/500)
export function DebtAmountText({ manwon }: { manwon: number }) {
  const { amount, unit } = formatDebtManwonParts(manwon);
  return (
    <span className="inline-flex items-baseline whitespace-nowrap opacity-80">
      <span className="text-[16px] font-semibold leading-none text-neutral-90">{amount}</span>
      {unit && <span className="text-[14px] font-medium leading-[17px] text-neutral-90">{unit}</span>}
    </span>
  );
}

// 진행단계 (피그마): "7단계. 인가결정" + Secondary-20 바
export function ProgressStepIndicator({
  step,
  procedure,
}: {
  step: number;
  procedure: RecommendedProcedure;
}) {
  const { current, total, title } = getProgressStepMeta(procedure, step);
  const percent = Math.round((current / total) * 100);

  return (
    <div className="flex flex-col justify-between gap-1.5 w-full min-w-0 h-[26px]">
      <p className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-90 whitespace-nowrap truncate">
        {current}단계. {title}
      </p>
      <div className="h-[6px] w-full max-w-[140px] rounded-[30px] bg-neutral-30 overflow-hidden">
        <div
          className="h-full rounded-l-[30px] bg-secondary-20"
          style={{ width: `${Math.max(percent, 4)}%` }}
        />
      </div>
    </div>
  );
}
