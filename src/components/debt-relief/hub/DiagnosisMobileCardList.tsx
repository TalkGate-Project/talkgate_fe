import EmptyState from "@/components/common/EmptyState";
import Checkbox from "@/components/common/Checkbox";
import LinkIcon from "@/components/icons/LinkIcon";
import AnalysisShareIcon from "@/components/icons/AnalysisShareIcon";
import {
  StatusBadge,
  DebtAmountText,
  ProcedureNameText,
  resolveFeePlanDisplay,
} from "@/components/debt-relief/DiagnosisBadges";
import { formatCustomerMeta } from "@/components/debt-relief/format";
import {
  resolveInProgressStepLabel,
  type DiagnosisListItem,
  type ProcedureStepTitlesByProcedure,
} from "@/types/debtRelief";
import type { FeePlanSummary } from "@/types/analysisFeePlan";

type Props = {
  items: DiagnosisListItem[];
  loading: boolean;
  onOpenResult: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  /** "진행단계"(n/m) 표시용 절차 마스터 데이터. 생략 시 하드코딩 폴백 사용 */
  stepTitlesByProcedure?: ProcedureStepTitlesByProcedure;
  /** 영업점(analysis): 카드별 공유 버튼 표시 */
  showShareButton?: boolean;
  onShareItem?: (item: DiagnosisListItem) => void;
};

function CardSkeleton() {
  return (
    <div className="h-[102px] rounded-[12px] border border-neutral-30 bg-card animate-pulse" />
  );
}

// 결제상태 라벨 색상 — 진행바 색과 짝을 맞춘다 (완납=primary, 진행중=secondary, 중도해지=danger, 환불처리=neutral).
const FEE_PLAN_LABEL_TEXT_CLASS: Record<string, string> = {
  완납: "text-primary-80 dark:text-primary-40",
  진행중: "text-secondary-60 dark:text-secondary-40",
  중도해지: "text-danger-40 dark:text-danger-40",
  환불처리: "text-neutral-50",
};

function MobileFeePlanBlock({ summary }: { summary: FeePlanSummary }) {
  const { label, barClassName } = resolveFeePlanDisplay(summary);
  const percent =
    summary.installmentCount > 0
      ? Math.min(100, Math.round((summary.paidInstallmentCount / summary.installmentCount) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0 max-w-[200px]">
      <div className="h-1.5 w-full rounded-[30px] bg-neutral-30 overflow-hidden">
        <div
          className={`h-full rounded-l-[30px] ${barClassName}`}
          style={{ width: `${Math.max(percent, 4)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-60">
        <span>
          {summary.paidInstallmentCount}/{summary.installmentCount}
        </span>
        <span className={FEE_PLAN_LABEL_TEXT_CLASS[label] ?? "text-neutral-60"}>{label}</span>
      </div>
    </div>
  );
}

// 데스크톱 DiagnosisTable(표)의 모바일 대응 카드 리스트.
// 피그마: 1행 이름·메타 / 절차명, 2행 결제금액 / 진단상태뱃지, 3행 결제진행바 / 총채무.
export default function DiagnosisMobileCardList({
  items,
  loading,
  onOpenResult,
  selectedIds,
  onToggleSelect,
  stepTitlesByProcedure,
  showShareButton = false,
  onShareItem,
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-[200px]">
        <EmptyState message="조건에 맞는 진단 결과가 없습니다." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const customerMeta = formatCustomerMeta(
          item.age,
          item.gender,
          item.occupation || "무직",
          item.ageGroupLabel
        );

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenResult(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenResult(item.id);
              }
            }}
            className="cursor-pointer flex flex-col gap-1.5 p-4 rounded-[12px] border border-neutral-30 bg-card"
          >
            {/* 0행: 체크박스 | 공유 대상 법인명(공유완료)·공유하기 버튼(미공유, 영업점만) */}
            <div className="flex items-center justify-between gap-2">
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggleSelect(item.id)}
                  ariaLabel={`${item.customerName} 선택`}
                  size={24}
                />
              </div>
              {showShareButton &&
                (item.isShared ? (
                  <span className="inline-flex h-[22px] max-w-[160px] items-center justify-center rounded-[24px] border border-neutral-20 px-2 py-0.5">
                    <span className="truncate text-[12px] font-semibold leading-[17px] text-neutral-60">
                      {item.lawyerProjectName || "공유된 프로젝트"}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareItem?.(item);
                    }}
                    className="cursor-pointer -m-2 p-2 inline-flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label={`${item.customerName} 공유하기`}
                  >
                    <AnalysisShareIcon tone="muted" className="w-6 h-6" />
                  </button>
                ))}
            </div>

            {/* 1행: 이름 + 링크 + 나이·성별·직업 | 추천 절차명 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <p className="text-[16px] font-semibold leading-[19px] text-neutral-90 truncate">
                  {item.customerName}
                </p>
                {item.isCustomerConnected && (
                  <LinkIcon size={16} className="text-secondary-60 shrink-0" />
                )}
                {customerMeta && (
                  <span className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80 truncate">
                    {customerMeta}
                  </span>
                )}
              </div>
              <ProcedureNameText procedure={item.recommendedProcedure} />
            </div>

            {/* 2행: 결제 금액 | 진단 상태뱃지 */}
            <div className="flex items-center justify-between gap-2">
              {item.feePlanSummary ? (
                <span className="text-[14px] font-bold leading-none text-foreground">
                  {item.feePlanSummary.totalAmount.toLocaleString("ko-KR")}
                  <span className="ml-0.5 text-[12px] font-medium">만원</span>
                </span>
              ) : (
                <span className="text-[12px] font-medium text-neutral-50">결제 미설정</span>
              )}
              <span className="shrink-0">
                <StatusBadge
                  status={item.status}
                  rejectionReason={item.rejectionReason}
                  stepLabel={resolveInProgressStepLabel(item, stepTitlesByProcedure)}
                />
              </span>
            </div>

            {/* 3행: 결제 진행바 + 회차 + 결제상태 | 총 채무 */}
            <div className="flex items-end gap-2 w-full min-w-0">
              {item.feePlanSummary ? (
                <MobileFeePlanBlock summary={item.feePlanSummary} />
              ) : (
                <span />
              )}
              <span className="ml-auto shrink-0">
                <DebtAmountText manwon={item.totalDebtManwon} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
