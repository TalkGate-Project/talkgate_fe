import EmptyState from "@/components/common/EmptyState";
import Checkbox from "@/components/common/Checkbox";
import LinkIcon from "@/components/icons/LinkIcon";
import {
  ProcedureBadge,
  ProgressStepIndicator,
  SuccessProbabilityText,
  DebtAmountText,
} from "@/components/debt-relief/DiagnosisBadges";
import { formatCustomerMeta } from "@/components/debt-relief/format";
import type { DiagnosisListItem } from "@/types/debtRelief";

type Props = {
  items: DiagnosisListItem[];
  loading: boolean;
  onOpenResult: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
};

function CardSkeleton() {
  return (
    <div className="h-[104px] rounded-[12px] border border-neutral-30 bg-card animate-pulse" />
  );
}

// 데스크톱 DiagnosisTable(표)의 모바일 대응 카드 리스트. 컬럼형 표가 아니라 카드 안에서
// 정보 위계가 바뀌고, 행별 개별 공유 버튼 없이 카드 전체가 탭 대상(결과보기)이라 DiagnosisTable과
// 마크업을 공유하지 않고 별도 컴포넌트로 분리했다 (md:hidden / DiagnosisTable은 hidden md:block).
// 개별 공유는 체크박스로 선택 후 상단 "공유하기"(bulk) 액션을 쓰는 것으로 대체된다.
export default function DiagnosisMobileCardList({
  items,
  loading,
  onOpenResult,
  selectedIds,
  onToggleSelect,
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
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
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const customerMeta = formatCustomerMeta(item.age, item.gender, item.occupation);

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
            className="cursor-pointer flex items-center gap-3 p-4 rounded-[12px] border border-neutral-30 bg-card hover:bg-neutral-10/60"
          >
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
                ariaLabel={`${item.customerName} 선택`}
                size={28}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <p className="text-[16px] font-semibold text-foreground truncate">{item.customerName}</p>
                  {item.isShared && <LinkIcon size={14} className="text-primary-60 shrink-0" />}
                </div>
                <span className="shrink-0">
                  <ProcedureBadge procedure={item.recommendedProcedure} />
                </span>
              </div>

              {customerMeta && <p className="text-[12px] text-neutral-50">{customerMeta}</p>}

              <div className="flex items-end justify-between gap-3">
                <ProgressStepIndicator
                  step={item.progressStep}
                  procedure={item.recommendedProcedure}
                />
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  <SuccessProbabilityText value={item.successProbability} />
                  <DebtAmountText manwon={item.totalDebtManwon} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
