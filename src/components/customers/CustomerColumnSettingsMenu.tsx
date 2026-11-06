import { createPortal } from "react-dom";
import { useState } from "react";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";
import type { CustomerTableColumnsState } from "@/hooks/useCustomerTableColumns";
import type { CustomerColumnKey } from "./customerTableColumns";
import Checkbox from "@/components/common/Checkbox";

const PANEL_WIDTH = 260;

type CustomerColumnSettingsMenuProps = {
  columnsState: CustomerTableColumnsState;
};

function moveKey(order: CustomerColumnKey[], key: CustomerColumnKey, targetIndex: number) {
  const next = order.filter((item) => item !== key);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, key);
  return next;
}

function ArrowButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: "up" | "down";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[4px] text-neutral-60 hover:bg-neutral-20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={direction === "down" ? "rotate-180" : ""}>
        <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** 고객목록 열 표시 여부·순서 설정. 드래그(데스크톱) 또는 화살표 버튼(모바일 포함)으로 순서를 바꾼다 */
export default function CustomerColumnSettingsMenu({ columnsState }: CustomerColumnSettingsMenuProps) {
  const { orderedColumns, hiddenKeys, setColumnOrder, setColumnVisible, resetColumnSettings } = columnsState;
  const [open, setOpen] = useState(false);
  const [draggingKey, setDraggingKey] = useState<CustomerColumnKey | null>(null);
  const { rootRef, anchorRef, panelRef, panelPos } = useAnchoredPanel<HTMLButtonElement>({
    open,
    onClose: () => setOpen(false),
    panelWidth: PANEL_WIDTH,
    estimatedPanelHeight: 420,
    align: "start",
  });

  const order = orderedColumns.map((column) => column.key);

  const handleDragOver = (event: React.DragEvent, overKey: CustomerColumnKey) => {
    if (!draggingKey) return;
    event.preventDefault();
    if (overKey === draggingKey) return;
    setColumnOrder(moveKey(order, draggingKey, order.indexOf(overKey)));
  };

  return (
    <div ref={rootRef} className="relative inline-flex group">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
        aria-label="컬럼 설정"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 5H20M4 5V19M4 5H9.33M20 5V19M20 5H14.67M20 19H4M20 19H14.67M4 19H9.33M9.33 5V19M9.33 5H14.67M9.33 19H14.67M14.67 5V19" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {!open && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-10 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
            컬럼 설정
          </div>
        </div>
      )}
      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="컬럼 설정"
            data-anchored-panel
            className="fixed z-[1000] rounded-[8px] border border-neutral-30 bg-card shadow-lg"
            style={{ top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
          >
            <div className="px-4 pt-3 pb-2">
              <div className="text-[14px] font-semibold text-neutral-90">컬럼 설정</div>
              <div className="mt-0.5 text-[12px] text-neutral-60">표시할 항목을 선택하고 순서를 바꿀 수 있어요.</div>
            </div>
            <ul className="max-h-[360px] overflow-y-auto py-1 border-t border-neutral-30">
              {orderedColumns.map((column, index) => {
                const visible = !hiddenKeys.includes(column.key);
                return (
                  <li
                    key={column.key}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingKey(column.key);
                    }}
                    onDragOver={(event) => handleDragOver(event, column.key)}
                    onDrop={(event) => event.preventDefault()}
                    onDragEnd={() => setDraggingKey(null)}
                    className={`h-[40px] pl-2 pr-3 flex items-center gap-2 select-none ${
                      draggingKey === column.key ? "bg-neutral-20" : "hover:bg-neutral-10 dark:hover:bg-neutral-20"
                    }`}
                  >
                    <span className="hidden md:flex w-5 h-6 items-center justify-center cursor-grab text-neutral-50" aria-hidden>
                      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                        <circle cx="3.5" cy="3" r="1.3" /><circle cx="8.5" cy="3" r="1.3" />
                        <circle cx="3.5" cy="8" r="1.3" /><circle cx="8.5" cy="8" r="1.3" />
                        <circle cx="3.5" cy="13" r="1.3" /><circle cx="8.5" cy="13" r="1.3" />
                      </svg>
                    </span>
                    <label className={`flex-1 min-w-0 flex items-center gap-2 ${column.hideable ? "cursor-pointer" : "cursor-default"}`}>
                      <Checkbox
                        checked={visible}
                        disabled={!column.hideable}
                        onChange={(next) => setColumnVisible(column.key, next)}
                        ariaLabel={`${column.label} 표시`}
                        size={20}
                        className="shrink-0"
                      />
                      <span className={`truncate text-[14px] ${visible ? "text-neutral-90" : "text-neutral-50"}`}>
                        {column.label}
                      </span>
                      {!column.hideable && <span className="text-[11px] text-neutral-50 shrink-0">필수</span>}
                    </label>
                    <ArrowButton
                      direction="up"
                      disabled={index === 0}
                      label={`${column.label} 위로`}
                      onClick={() => setColumnOrder(moveKey(order, column.key, index - 1))}
                    />
                    <ArrowButton
                      direction="down"
                      disabled={index === orderedColumns.length - 1}
                      label={`${column.label} 아래로`}
                      onClick={() => setColumnOrder(moveKey(order, column.key, index + 1))}
                    />
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-2.5 border-t border-neutral-30 flex items-center justify-between gap-2">
              <span className="text-[11px] text-neutral-50 leading-[14px]">
                너비는 헤더 경계를 드래그해 조정해요.
              </span>
              <button
                type="button"
                onClick={resetColumnSettings}
                className="cursor-pointer shrink-0 h-[28px] px-2.5 rounded-[5px] border border-neutral-30 text-[13px] text-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-20"
              >
                초기화
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
