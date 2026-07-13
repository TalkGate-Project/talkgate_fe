import SortIcon from "@/components/common/SortIcon";
import EmptyState from "@/components/common/EmptyState";
import Checkbox from "@/components/common/Checkbox";
import LinkIcon from "@/components/icons/LinkIcon";
import {
  ProcedureBadge,
  ProgressStepIndicator,
  SuccessProbabilityText,
  DebtAmountText,
} from "@/components/debt-relief/DiagnosisBadges";
import {
  formatAvailableIncome,
  formatConsultedDate,
  formatCustomerMeta,
} from "@/components/debt-relief/format";
import type {
  DiagnosisListItem,
  DiagnosisSortField,
  SortDirection,
} from "@/types/debtRelief";

// 목록 행 "공유하기" 버튼 전용 아이콘 (피그마 스펙 SVG 그대로 사용, 이 파일 안에서만 씀)
function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M8.68387 13.3419C8.88616 12.9381 9 12.4824 9 12C9 11.5176 8.88616 11.0619 8.68387 10.6581M8.68387 13.3419C8.19134 14.3251 7.17449 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.17449 9 8.19134 9.67492 8.68387 10.6581M8.68387 13.3419L15.3161 16.6581M8.68387 10.6581L15.3161 7.34193M15.3161 7.34193C15.8087 8.32508 16.8255 9 18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 6.48237 15.1138 6.93815 15.3161 7.34193ZM15.3161 16.6581C15.1138 17.0619 15 17.5176 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C16.8255 15 15.8087 15.6749 15.3161 16.6581Z"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  items: DiagnosisListItem[];
  loading: boolean;
  sortField: DiagnosisSortField | undefined;
  sortDirection: SortDirection;
  onToggleSort: (field: DiagnosisSortField) => void;
  onOpenResult: (id: string) => void;
  selectedIds: Set<string>;
  allSelectedOnPage: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onShareRow: (id: string) => void;
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

export default function DiagnosisTable({
  items,
  loading,
  sortField,
  sortDirection,
  onToggleSort,
  onOpenResult,
  selectedIds,
  allSelectedOnPage,
  onToggleSelect,
  onToggleSelectAll,
  onShareRow,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-separate border-spacing-y-0">
        <thead>
          <tr>
            <th className={`${HEADER_CELL} rounded-l-[8px] w-11`}>
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={allSelectedOnPage}
                  onChange={onToggleSelectAll}
                  ariaLabel="전체 선택"
                  size={24}
                />
              </div>
            </th>
            <th className={`${HEADER_CELL} text-left`}>고객정보</th>
            <SortableHeader
              label="총 채무"
              field="totalDebt"
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={onToggleSort}
            />
            <th className={`${HEADER_CELL} text-left`}>월 가용소득</th>
            <th className={`${HEADER_CELL} text-left`}>추천 절차</th>
            <SortableHeader
              label="성공 가능성"
              field="successProbability"
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={onToggleSort}
            />
            <th className={`${HEADER_CELL} text-left min-w-[140px]`}>진행단계</th>
            <SortableHeader
              label="상담일"
              field="consultedAt"
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={onToggleSort}
              className="w-[56px] px-2"
            />
            <th className={`${HEADER_CELL} w-[72px] px-2`} aria-label="결과보기" />
            <th className={`${HEADER_CELL} rounded-r-[8px] w-10 px-1`} aria-label="공유" />
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b border-border">
                <td colSpan={9} className="h-[48px] px-4">
                  <div className="h-4 w-full max-w-[520px] bg-neutral-10 rounded animate-pulse" />
                </td>
              </tr>
            ))}

          {!loading &&
            items.map((item) => {
              const customerMeta = formatCustomerMeta(item.age, item.gender);
              return (
              <tr key={item.id} className="border-b border-border hover:bg-neutral-10/60 h-[48px]">
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-semibold leading-[17px] text-foreground opacity-80">
                      {item.customerName}
                    </p>
                    {item.isShared && <LinkIcon size={14} className="text-primary-80 shrink-0" />}
                  </div>
                  {customerMeta && (
                    <p className="text-[12px] font-medium leading-[14px] text-neutral-60 mt-0.5 opacity-80">
                      {customerMeta}
                    </p>
                  )}
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
                  <ProcedureBadge procedure={item.recommendedProcedure} />
                </td>
                <td className="px-4 py-2 align-middle">
                  <SuccessProbabilityText value={item.successProbability} />
                </td>
                <td className="px-4 py-2 align-middle min-w-[140px]">
                  <ProgressStepIndicator
                    step={item.progressStep}
                    procedure={item.recommendedProcedure}
                  />
                </td>
                <td className="px-2 py-2 align-middle text-[14px] font-medium leading-[17px] text-neutral-90 whitespace-nowrap w-[56px] opacity-80">
                  {formatConsultedDate(item.consultedAt)}
                </td>
                <td className="px-2 py-2 align-middle text-right w-[72px]">
                  <button
                    type="button"
                    onClick={() => onOpenResult(item.id)}
                    className="cursor-pointer inline-flex items-center justify-center h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10 whitespace-nowrap"
                  >
                    결과보기
                  </button>
                </td>
                <td className="px-1 py-2 align-middle text-right w-10">
                  <button
                    type="button"
                    onClick={() => onShareRow(item.id)}
                    className="cursor-pointer w-8 h-8 inline-flex items-center justify-center rounded-[6px] hover:bg-neutral-10 transition-colors"
                    aria-label={`${item.customerName} 진단 공유하기`}
                  >
                    <ShareIcon />
                  </button>
                </td>
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
