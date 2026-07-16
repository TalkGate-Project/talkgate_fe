import SortIcon from "@/components/common/SortIcon";
import EmptyState from "@/components/common/EmptyState";
import Checkbox from "@/components/common/Checkbox";
import LinkIcon from "@/components/icons/LinkIcon";
import AnalysisShareIcon from "@/components/icons/AnalysisShareIcon";
import {
  StatusBadge,
  DebtAmountText,
  FeePlanCell,
} from "@/components/debt-relief/DiagnosisBadges";
import {
  formatAvailableIncome,
  formatConsultedDate,
  formatCustomerMeta,
} from "@/components/debt-relief/format";
import {
  RECOMMENDED_PROCEDURE_LABEL,
  getProgressStepMeta,
  type DiagnosisListItem,
  type DiagnosisSortField,
  type SortDirection,
} from "@/types/debtRelief";

type Props = {
  items: DiagnosisListItem[];
  loading: boolean;
  sortField: DiagnosisSortField | undefined;
  sortDirection: SortDirection;
  onToggleSort: (field: DiagnosisSortField) => void;
  onOpenResult: (id: string) => void;
  /** 영업점(analysis): 행별 공유 버튼 표시 */
  showShareColumn?: boolean;
  onShareItem?: (id: string) => void;
  /** 변호사(lawyer): 담당직원 컬럼 표시 */
  showAssigneeColumn?: boolean;
  selectedIds: Set<string>;
  allSelectedOnPage: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
};

const HEADER_CELL_BASE =
  "bg-neutral-20 h-[40px] text-[16px] font-medium text-neutral-60 whitespace-nowrap";
const HEADER_CELL = `${HEADER_CELL_BASE} px-4`;

function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onToggleSort,
  align = "left",
  className = "px-4",
}: {
  label: string;
  field: DiagnosisSortField;
  sortField: DiagnosisSortField | undefined;
  sortDirection: SortDirection;
  onToggleSort: (field: DiagnosisSortField) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const state = sortField === field ? (sortDirection === "asc" ? "asc" : "desc") : "none";
  return (
    <th className={`${HEADER_CELL_BASE} ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      <button
        type="button"
        onClick={() => onToggleSort(field)}
        className={`inline-flex items-center gap-0.5 cursor-pointer hover:text-neutral-90 ${
          align === "right" ? "justify-end w-full" : ""
        }`}
        aria-label={`${label} 정렬`}
      >
        <span>{label}</span>
        <SortIcon state={state} />
      </button>
    </th>
  );
}

// 절차진행중 상태뱃지에 붙는 "현재/총단계" (예: "5/9"). 총단계를 모르면 생략.
function resolveInProgressStepLabel(item: DiagnosisListItem): string | undefined {
  if (item.status !== "in_progress") return undefined;
  const { current, total } = getProgressStepMeta(item.recommendedProcedure, item.progressStep);
  return total > 1 ? `${current}/${total}` : undefined;
}

function AssigneeCell({ item }: { item: DiagnosisListItem }) {
  if (!item.assigneeName) {
    return <span className="text-[14px] font-medium text-neutral-50">-</span>;
  }

  const initial = item.assigneeName.charAt(0);

  return (
    <div className="flex items-center gap-2 min-w-0">
      {item.assigneeProfileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.assigneeProfileImageUrl}
          alt=""
          className="w-8 h-8 rounded-full object-cover shrink-0 bg-neutral-20"
        />
      ) : (
        <span className="w-8 h-8 rounded-full bg-neutral-20 text-neutral-60 text-[12px] font-semibold inline-flex items-center justify-center shrink-0">
          {initial}
        </span>
      )}
      <div className="flex flex-col min-w-0 gap-0.5">
        <p className="text-[14px] font-semibold leading-[17px] text-foreground opacity-80 truncate">
          {item.assigneeName}
        </p>
        {item.assigneeProjectName ? (
          <p className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80 truncate">
            {item.assigneeProjectName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function DiagnosisTable({
  items,
  loading,
  sortField,
  sortDirection,
  onToggleSort,
  onOpenResult,
  showShareColumn = false,
  onShareItem,
  showAssigneeColumn = false,
  selectedIds,
  allSelectedOnPage,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  // 기본 9열(체크~상담일) + 조건부 공유/담당
  const columnCount = 9 + (showShareColumn ? 1 : 0) + (showAssigneeColumn ? 1 : 0);
  const consultedRoundedRight = !showShareColumn && !showAssigneeColumn;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-separate border-spacing-y-0">
        <thead>
          <tr>
            <th className={`${HEADER_CELL} rounded-l-[8px] w-11 align-middle`}>
              <div className="flex items-center h-full" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={allSelectedOnPage}
                  onChange={onToggleSelectAll}
                  ariaLabel="전체 선택"
                  size={24}
                  uncheckedFill="var(--neutral-20)"
                  className="shrink-0"
                />
              </div>
            </th>
            <th className={`${HEADER_CELL} text-left`}>고객정보</th>
            <th className={`${HEADER_CELL} text-left`}>지역</th>
            <th className={`${HEADER_CELL} text-left`}>총 채무</th>
            <th className={`${HEADER_CELL} text-left`}>월 가용소득</th>
            <th className={`${HEADER_CELL} text-left`}>상태</th>
            <th className={`${HEADER_CELL} text-left min-w-[140px]`}>결제 정보</th>
            <SortableHeader
              label="상담일"
              field="consultedAt"
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={onToggleSort}
              className={`w-[56px] px-2${consultedRoundedRight ? " rounded-r-[8px]" : ""}`}
            />
            {showAssigneeColumn && (
              <th className={`${HEADER_CELL} ${showShareColumn ? "" : "rounded-r-[8px] "}text-left min-w-[140px]`}>
                담당직원
              </th>
            )}
            {/* 영업점 공유 열: 제목 없이 아이콘만. 우측 여백은 이 열 셀에만 적용 */}
            {showShareColumn && (
              <th
                className={`${HEADER_CELL_BASE} rounded-r-[8px] pl-3 pr-[78px] w-[102px]`}
                aria-label="공유하기"
              />
            )}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b border-border">
                <td colSpan={columnCount} className="h-[48px] px-4">
                  <div className="h-4 w-full max-w-[520px] bg-neutral-10 rounded animate-pulse" />
                </td>
              </tr>
            ))}

          {!loading &&
            items.map((item) => {
              const customerMeta = formatCustomerMeta(
                item.age,
                item.gender,
                undefined,
                item.ageGroupLabel
              );
              return (
                <tr
                  key={item.id}
                  onClick={() => onOpenResult(item.id)}
                  className="cursor-pointer border-b border-border hover:bg-neutral-10/60 min-h-[56px]"
                >
                  <td className="px-4 py-2 align-middle">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onChange={() => onToggleSelect(item.id)}
                        ariaLabel={`${item.customerName} 선택`}
                        size={24}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[14px] font-semibold leading-[17px] text-foreground opacity-80 truncate">
                          {item.customerName}
                        </p>
                        {item.isCustomerConnected && (
                          <LinkIcon size={16} className="text-[#2563EB] shrink-0" />
                        )}
                      </div>
                      {customerMeta ? (
                        <p className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80">
                          {customerMeta}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle text-[14px] font-medium leading-[17px] text-neutral-90 whitespace-nowrap opacity-80">
                    {item.region}
                  </td>
                  <td className="px-4 py-2 align-middle whitespace-nowrap">
                    <DebtAmountText manwon={item.totalDebtManwon} />
                  </td>
                  <td
                    className={`px-4 py-2 align-middle text-[14px] font-medium leading-[17px] whitespace-nowrap opacity-80 ${
                      item.monthlyAvailableIncomeManwon < 0 ? "text-danger-40" : "text-neutral-90"
                    }`}
                  >
                    {formatAvailableIncome(item.monthlyAvailableIncomeManwon)}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <div className="flex items-center gap-1.5">
                      {item.recommendedProcedure && (
                        <span className="text-[13px] font-medium text-neutral-60 whitespace-nowrap">
                          {RECOMMENDED_PROCEDURE_LABEL[item.recommendedProcedure]}
                        </span>
                      )}
                      <StatusBadge status={item.status} stepLabel={resolveInProgressStepLabel(item)} />
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle min-w-[140px]">
                    <FeePlanCell summary={item.feePlanSummary} />
                  </td>
                  <td className="px-2 py-2 align-middle text-[14px] font-medium leading-[17px] text-neutral-90 whitespace-nowrap w-[56px] opacity-80">
                    {formatConsultedDate(item.consultedAt)}
                  </td>
                  {showAssigneeColumn && (
                    <td className="px-4 py-2 align-middle min-w-[140px]">
                      <AssigneeCell item={item} />
                    </td>
                  )}
                  {showShareColumn && (
                    <td className="pl-3 pr-[78px] py-2 align-middle w-[102px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareItem?.(item.id);
                        }}
                        className="cursor-pointer inline-flex items-center justify-center w-6 h-6 hover:opacity-80 transition-opacity"
                        aria-label={`${item.customerName} 공유하기`}
                      >
                        <AnalysisShareIcon tone={item.isShared ? "active" : "muted"} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>

      {!loading && items.length === 0 && (
        <div className="h-[200px]">
          <EmptyState message="조건에 맞는 진단 결과가 없습니다." />
        </div>
      )}
    </div>
  );
}
