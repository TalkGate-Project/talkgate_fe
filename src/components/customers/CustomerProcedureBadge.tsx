import LinkIcon from "@/components/icons/LinkIcon";
import { normalizeProcedureType, type AnalysisProcedureType } from "@/types/analysis";

// 고객목록 "이름" 옆 분석 연결 배지 짧은 라벨. debtRelief.ts의 RECOMMENDED_PROCEDURE_LABEL(전체
// 명칭, "개인회생"/"개인파산")과 달리 목록 배지 전용 축약 표기. 배지가 이름 옆에 붙고 뒤에
// "n/m" 단계까지 이어붙어서 폭이 빠듯하다 — 4자를 넘기지 않는다.
const PROCEDURE_SHORT_LABEL: Record<AnalysisProcedureType, string> = {
  individual_rehabilitation: "회생",
  bankruptcy: "파산",
  fresh_start_fund: "새출발",
  speedy_debt_adjustment: "신속조정",
  pre_workout: "프리워크",
  personal_workout: "개인워크",
};

type Props = {
  /** 절차 추적 시작 전이라도 분석 데이터 자체는 연결된 경우 true (Analysis/Lawyer 프로젝트) */
  isAnalysisConnected?: boolean;
  trackingProcedure?: AnalysisProcedureType | null;
  currentProcedureStep?: number | null;
  totalProcedureSteps?: number | null;
};

/**
 * 고객목록에서 분석(회생·파산 진단)과 연결된 고객임을 나타내는 배지.
 * 절차 추적이 시작됐으면 "파산 1/9"처럼 라벨을 붙이고, 아직 연결만 된 상태(절차 미추적)면
 * 아이콘만 노출한다 — isAnalysisConnected 없이 trackingProcedure만 보고 판단하면
 * 연결됐지만 절차 추적 전인 고객에게 배지가 아예 안 뜨는 문제가 있었다.
 */
export default function CustomerProcedureBadge({
  isAnalysisConnected,
  trackingProcedure,
  currentProcedureStep,
  totalProcedureSteps,
}: Props) {
  const hasProcedure = Boolean(trackingProcedure && totalProcedureSteps);
  if (!hasProcedure && !isAnalysisConnected) return null;

  return (
    <span className="inline-flex items-center gap-1 h-[24px] px-2 rounded-full bg-white border border-secondary-20 text-[12px] font-medium leading-[14px] text-black whitespace-nowrap shrink-0">
      <LinkIcon size={14} className="text-secondary-60 shrink-0" />
      {hasProcedure &&
        `${PROCEDURE_SHORT_LABEL[normalizeProcedureType(trackingProcedure!)]} ${currentProcedureStep ?? 1}/${totalProcedureSteps}`}
    </span>
  );
}
