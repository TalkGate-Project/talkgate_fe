import LinkIcon from "@/components/icons/LinkIcon";
import type { AnalysisProcedureType } from "@/types/analysis";

// 고객목록 "이름" 옆 분석 연결 배지 짧은 라벨. debtRelief.ts의 RECOMMENDED_PROCEDURE_LABEL(전체
// 명칭, "개인회생"/"채무조정"/"파산")과 달리 목록 배지 전용 축약 표기("회생"/"채무"/"파산").
const PROCEDURE_SHORT_LABEL: Record<AnalysisProcedureType, string> = {
  individual_rehabilitation: "회생",
  debt_adjustment: "채무",
  bankruptcy: "파산",
};

type Props = {
  trackingProcedure?: AnalysisProcedureType | null;
  currentProcedureStep?: number | null;
  totalProcedureSteps?: number | null;
};

/** 고객목록에서 분석(회생·파산 진단)과 연결된 고객임을 나타내는 배지. 예: "파산 1/9" */
export default function CustomerProcedureBadge({
  trackingProcedure,
  currentProcedureStep,
  totalProcedureSteps,
}: Props) {
  if (!trackingProcedure || !totalProcedureSteps) return null;

  return (
    <span className="inline-flex items-center gap-1 h-[24px] px-2 rounded-full bg-white border border-secondary-20 text-[12px] font-medium leading-[14px] text-black whitespace-nowrap shrink-0">
      <LinkIcon size={14} className="text-secondary-60 shrink-0" />
      {PROCEDURE_SHORT_LABEL[trackingProcedure]} {currentProcedureStep ?? 1}/{totalProcedureSteps}
    </span>
  );
}
