import EmptyState from "@/components/common/EmptyState";
import Checkbox from "@/components/common/Checkbox";
import LinkIcon from "@/components/icons/LinkIcon";
import { StatusBadge } from "@/components/debt-relief/DiagnosisBadges";
import {
  formatCustomerMeta,
  formatDebtManwonParts,
  formatFeePlanSummary,
} from "@/components/debt-relief/format";
import { getProgressStepMeta, type DiagnosisListItem } from "@/types/debtRelief";

type Props = {
  items: DiagnosisListItem[];
  loading: boolean;
  onOpenResult: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
};

function CardSkeleton() {
  return (
    <div className="h-[86px] rounded-[12px] border border-neutral-30 bg-card animate-pulse" />
  );
}

function MobileProgressBlock({
  step,
  procedure,
  feePlanSummary,
  debtManwon,
}: {
  step: number;
  procedure: DiagnosisListItem["recommendedProcedure"];
  feePlanSummary: DiagnosisListItem["feePlanSummary"];
  debtManwon: number;
}) {
  const { current, total, title } = getProgressStepMeta(procedure, step);
  const isKnown = total > 1;
  const percent = isKnown ? Math.round((current / total) * 100) : 0;
  const { amount, unit } = formatDebtManwonParts(debtManwon);

  return (
    // 피그마: [진행라벨+바] | [결제정보] | [채무] — 바·결제정보·채무 하단 맞춤
    <div className="flex items-end gap-2 w-full min-w-0">
      <div className="flex flex-col gap-1 w-[148px] shrink-0 min-w-0">
        <p className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-90 whitespace-nowrap truncate">
          {isKnown ? `${current}/${total} · ${title}` : title}
        </p>
        <div className="h-1.5 w-full rounded-[30px] bg-neutral-30 overflow-hidden">
          <div
            className="h-full rounded-l-[30px] bg-secondary-20"
            style={{ width: `${isKnown ? Math.max(percent, 4) : 0}%` }}
          />
        </div>
      </div>

      <div className="ml-auto flex items-end gap-3 shrink-0 min-w-0">
        {feePlanSummary && (
          <span className="text-[11px] font-medium leading-none text-neutral-60 truncate max-w-[110px]">
            {formatFeePlanSummary(feePlanSummary)}
          </span>
        )}
        <span className="inline-flex items-end whitespace-nowrap opacity-80 shrink-0">
          <span className="text-[14px] font-bold leading-none text-foreground">{amount}</span>
          {unit && (
            <span className="text-[12px] font-medium leading-none text-foreground">{unit}</span>
          )}
        </span>
      </div>
    </div>
  );
}

// 데스크톱 DiagnosisTable(표)의 모바일 대응 카드 리스트.
// 피그마 consultation list: 327×86, pad 16×12, gap 16, 체크(24) + 콘텐츠(이름/메타/배지 · 진행/점수/채무).
export default function DiagnosisMobileCardList({
  items,
  loading,
  onOpenResult,
  selectedIds,
  onToggleSelect,
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
        // 모바일 카드 헤더는 피그마처럼 나이·성별 위주. 직업은 공간이 좁아 생략.
        const customerMeta = formatCustomerMeta(
          item.age,
          item.gender,
          undefined,
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
            className="cursor-pointer flex items-center gap-4 px-3 py-4 h-[86px] rounded-[12px] border border-neutral-30 bg-card"
          >
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
                ariaLabel={`${item.customerName} 선택`}
                size={24}
              />
            </div>

            <div className="flex-1 min-w-0 h-[54px] flex flex-col justify-between">
              {/* 상단: 이름 + 링크 + 나이·성별 | 절차 칩 */}
              <div className="flex items-center justify-between gap-2 min-h-[25px]">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <p className="text-[16px] font-semibold leading-[19px] text-neutral-90 truncate">
                    {item.customerName}
                  </p>
                  {item.isCustomerConnected && (
                    <LinkIcon size={16} className="text-secondary-60 shrink-0" />
                  )}
                  {customerMeta && (
                    <span className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80 whitespace-nowrap shrink-0">
                      {customerMeta}
                    </span>
                  )}
                </div>
                <span className="shrink-0 opacity-80">
                  <StatusBadge status={item.status} />
                </span>
              </div>

              {/* 하단: 진행단계 · 결제정보 · 채무 / 진행 바 */}
              <MobileProgressBlock
                step={item.progressStep}
                procedure={item.recommendedProcedure}
                feePlanSummary={item.feePlanSummary}
                debtManwon={item.totalDebtManwon}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
