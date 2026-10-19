import { createPortal } from "react-dom";
import { useState } from "react";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";
import type { CustomerSortType as SortKey } from "@/hooks/useCustomersFilters";

type SortOrder = "ASC" | "DESC";

type ApplicationTimeSortMenuProps = {
  sortType?: SortKey;
  sortOrder?: SortOrder;
  onSetSort?: (column: SortKey | null, order?: SortOrder) => void;
};

const PANEL_WIDTH = 168;

const SORT_GROUPS: { key: "applicationDate" | "lastNoteDate"; label: string }[] = [
  { key: "applicationDate", label: "신청시간" },
  { key: "lastNoteDate", label: "최근메모" },
];

const SORT_ORDERS: { order: SortOrder; label: string }[] = [
  { order: "DESC", label: "최신순" },
  { order: "ASC", label: "오래된순" },
];

/**
 * 신청시간 열 헤더. 셀이 "신청시간 / 최근메모" 2줄이라 헤더는 한 줄로 두고,
 * 클릭 시 메뉴에서 두 기준 중 하나로 정렬한다. 현재 정렬 기준이 헤더 라벨이 된다.
 */
export default function ApplicationTimeSortMenu({
  sortType,
  sortOrder,
  onSetSort,
}: ApplicationTimeSortMenuProps) {
  const [open, setOpen] = useState(false);
  const { rootRef, anchorRef, panelRef, panelPos } = useAnchoredPanel<HTMLButtonElement>({
    open,
    onClose: () => setOpen(false),
    panelWidth: PANEL_WIDTH,
    estimatedPanelHeight: 220,
  });

  const activeGroup = SORT_GROUPS.find((g) => g.key === sortType);
  const headerLabel = activeGroup?.label ?? "신청시간";

  const handleSelect = (column: SortKey | null, order?: SortOrder) => {
    onSetSort?.(column, order);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="inline-flex">
      <button
        ref={anchorRef}
        type="button"
        className={`cursor-pointer inline-flex items-center gap-1 hover:text-neutral-90 ${
          activeGroup ? "text-neutral-90" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${headerLabel} 정렬 메뉴`}
      >
        <span>{headerLabel}</span>
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 1L8 4H2L5 1Z" fill={activeGroup && sortOrder === "ASC" ? "#111111" : "#B0B0B0"} />
          <path d="M5 11L2 8H8L5 11Z" fill={activeGroup && sortOrder === "DESC" ? "#111111" : "#B0B0B0"} />
        </svg>
      </button>
      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            data-anchored-panel
            className="fixed z-[1000] rounded-[5px] border border-neutral-30 bg-card py-1 shadow-lg"
            style={{ top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
          >
            {SORT_GROUPS.map((group, groupIdx) => (
              <div key={group.key} className={groupIdx > 0 ? "border-t border-neutral-30 mt-1 pt-1" : ""}>
                <div className="px-3 pt-1 pb-1 text-[12px] text-neutral-60">{group.label}</div>
                {SORT_ORDERS.map(({ order, label }) => {
                  const isActive = sortType === group.key && sortOrder === order;
                  return (
                    <button
                      key={order}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      className={`cursor-pointer w-full h-[34px] px-3 flex items-center justify-between text-[14px] hover:bg-neutral-10 dark:hover:bg-neutral-20 ${
                        isActive ? "font-semibold text-neutral-90" : "text-neutral-80"
                      }`}
                      onClick={() => handleSelect(group.key, order)}
                    >
                      <span>{label}</span>
                      {isActive && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            {activeGroup && (
              <div className="border-t border-neutral-30 mt-1 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  className="cursor-pointer w-full h-[34px] px-3 flex items-center text-[13px] text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                  onClick={() => handleSelect(null)}
                >
                  기본 정렬로 되돌리기
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
