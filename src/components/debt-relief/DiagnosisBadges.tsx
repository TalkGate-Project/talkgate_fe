import {
  DIAGNOSIS_STATUS_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import type { AnalysisStatus } from "@/types/analysis";
import type { FeePlanSummary } from "@/types/analysisFeePlan";
import { formatDebtManwonParts } from "@/components/debt-relief/format";
import { wonToManwon } from "@/components/stats/fee/feeFormat";
import Tooltip from "@/components/common/Tooltip";

// 상태 배지 색상 — 피그마 chip 스펙 6종 확정(2026-07-20):
// 상담중=Cyan(#E1F7FF/#2585EB), 검토중=Warning, 반려됨=Error, 계약대기중=Indigo(#E4E3FF/#5856D6),
// 절차진행중=Secondary, 중단됨=Light gray(#E2E2E2/#595959 = neutral-30/neutral-70).
// Cyan·Indigo·절차진행중(Secondary-10 #E4EDFF)은 프로젝트 컬러 스케일과 정확히 일치하지 않아 hex 고정.
// 다크모드: 기존 "chip Dark" 공식(배경 bg-*-10/90, 텍스트 *-80)을 따르되, Cyan·Indigo는 다크 스펙이
// 없어 같은 공식(배경 90% 불투명, 텍스트를 더 진한 톤으로)으로 추론한 값 — 피그마 다크 스펙 나오면 교체.
export const STATUS_BADGE_STYLE: Record<AnalysisStatus, string> = {
  consulting: "bg-[#E1F7FF] text-[#2585EB] dark:bg-[#E1F7FF]/90 dark:text-[#0A5A8C]",
  reviewing: "bg-warning-10 text-warning-60 dark:bg-warning-10/90 dark:text-warning-80",
  rejected: "bg-danger-10 text-danger-40 dark:bg-danger-10/90 dark:text-danger-80",
  contract_pending: "bg-[#E4E3FF] text-[#5856D6] dark:bg-[#E4E3FF]/90 dark:text-[#3730A3]",
  in_progress: "bg-[#E4EDFF] text-[#2563EB] dark:bg-secondary-10/90 dark:text-secondary-80",
  suspended: "bg-neutral-30 text-neutral-70 dark:bg-neutral-60 dark:text-neutral-25",
};

export function StatusBadge({
  status,
  rejectionReason,
  stepLabel,
}: {
  status: AnalysisStatus;
  /** 반려됨 상태 hover 시 표시할 사유. 목록 응답엔 없어 상세에서만 넘겨받는다 — 없으면 툴팁 생략. */
  rejectionReason?: string | null;
  /** 절차진행중일 때만 붙는 "현재/총단계" (예: "5/9") */
  stepLabel?: string;
}) {
  // 피그마 chip 스펙: padding 2px 4px, radius 5px(완전한 pill 아님), 12px/500/14 line-height,
  // 텍스트 opacity 0.8
  const badge = (
    <span
      className={`inline-flex items-center justify-center h-[18px] px-1 py-0.5 rounded-[5px] whitespace-nowrap ${STATUS_BADGE_STYLE[status]}`}
    >
      <span className="text-[12px] font-medium leading-[14px] opacity-80">
        {DIAGNOSIS_STATUS_LABEL[status]}
        {status === "in_progress" && stepLabel ? ` ${stepLabel}` : ""}
      </span>
    </span>
  );

  if (status !== "rejected" || !rejectionReason) return badge;

  return (
    <Tooltip content={rejectionReason} multiline maxWidth="240px" delay={0}>
      {badge}
    </Tooltip>
  );
}

// 추천 절차 배지 색상 (피그마: 개인회생=Primary, 파산=Danger)
// 다크모드는 SummaryCards.tsx의 PROCEDURE_CHIP_STYLE과 동일한 값으로 통일
const PROCEDURE_BADGE_STYLE: Record<RecommendedProcedure, string> = {
  individual_rehab: "bg-primary-10 text-primary-80 dark:bg-primary-10/90 dark:text-primary-100",
  bankruptcy: "bg-danger-10 text-danger-40 dark:bg-danger-10/90 dark:text-danger-80",
};

export function ProcedureBadge({ procedure }: { procedure: RecommendedProcedure | undefined }) {
  // 아직 절차 추적을 시작하지 않은 등의 이유로 procedure를 알 수 없는 경우가 있어 방어.
  const label = procedure ? RECOMMENDED_PROCEDURE_LABEL[procedure] : undefined;
  const style = (procedure && PROCEDURE_BADGE_STYLE[procedure]) || "bg-neutral-20 text-neutral-70";
  return (
    <span
      className={`inline-flex items-center h-[22px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap ${style}`}
    >
      {label ?? "확인 중"}
    </span>
  );
}

// 추천 절차 이름 — 색칠된 배지(ProcedureBadge) 없이 플레인 텍스트로만 표기할 때 사용
// (예: 고객 상세 연동분석 카드는 절차명 옆에 StatusBadge를 붙이는 구성이라 배지를 겹쳐 쓰지 않는다)
export function ProcedureNameText({ procedure }: { procedure: RecommendedProcedure | undefined }) {
  const label = procedure ? RECOMMENDED_PROCEDURE_LABEL[procedure] : undefined;
  return (
    <span className="text-[14px] font-medium text-neutral-90 opacity-80 whitespace-nowrap">
      {label ?? "확인 중"}
    </span>
  );
}

// 성공 가능성: "78/100" — 강조(점수) 16px/600, 보조(/100) 10px/500
export function SuccessProbabilityText({ value }: { value: number }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span className="text-[16px] font-semibold leading-[19px] text-neutral-90">{score}</span>
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

// 결제정보 표시 상태 — feePlan.status(active/stopped/refunded)와 완납 여부를 조합해 계산.
// active인데 다 냈으면 "완납", 덜 냈으면 "진행중". stopped="중도해지", refunded="환불처리".
export function resolveFeePlanDisplay(summary: FeePlanSummary): { label: string; barClassName: string } {
  if (summary.status === "refunded") return { label: "환불처리", barClassName: "bg-neutral-40" };
  if (summary.status === "stopped") return { label: "중도해지", barClassName: "bg-danger-40" };
  if (summary.paidInstallmentCount >= summary.installmentCount) {
    return { label: "완납", barClassName: "bg-primary-40" };
  }
  return { label: "진행중", barClassName: "bg-secondary-40" };
}

// 결제 정보 셀: 금액 + 진행바 + 회차 + 상태라벨. feePlan이 없으면 "결제 미설정".
export function FeePlanCell({ summary }: { summary: FeePlanSummary | null }) {
  if (!summary) {
    return <span className="text-[13px] font-medium text-neutral-50">결제 미설정</span>;
  }

  const { label, barClassName } = resolveFeePlanDisplay(summary);
  const percent =
    summary.installmentCount > 0
      ? Math.min(100, Math.round((summary.paidInstallmentCount / summary.installmentCount) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-1 min-w-[130px] max-w-[160px]">
      <span className="text-[16px] font-semibold leading-none text-neutral-90">
        {wonToManwon(summary.totalAmount).toLocaleString("ko-KR")}
        <span className="ml-1 text-[12px] font-medium text-neutral-60">만원</span>
      </span>
      <div className="h-[6px] w-full rounded-[30px] bg-neutral-30 overflow-hidden">
        <div
          className={`h-full rounded-l-[30px] ${barClassName}`}
          style={{ width: `${Math.max(percent, 4)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-60">
        <span>
          {summary.paidInstallmentCount}/{summary.installmentCount}
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
}
