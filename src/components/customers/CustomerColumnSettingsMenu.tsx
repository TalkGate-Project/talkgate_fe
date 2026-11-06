import { createPortal } from "react-dom";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";
import type { CustomerTableColumnsState } from "@/hooks/useCustomerTableColumns";
import type { CustomerColumnKey } from "./customerTableColumns";
import Checkbox from "@/components/common/Checkbox";

const PANEL_WIDTH = 300;

type CustomerColumnSettingsMenuProps = {
  columnsState: CustomerTableColumnsState;
};

// 로그아웃 시 지워지는 `tg_` 접두어를 피해, 한 번 확인한 브라우저에서는 다시 띄우지 않는다.
const HINT_DISMISSED_STORAGE_KEY = "talkgate-customer-column-settings-hint-dismissed";
const HINT_DISMISSED_EVENT = "talkgate:customer-column-settings-hint-dismissed";

function readHintDismissed(): boolean {
  try {
    return window.localStorage.getItem(HINT_DISMISSED_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

function subscribeHintDismissed(onChange: () => void) {
  window.addEventListener(HINT_DISMISSED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(HINT_DISMISSED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * 컬럼 설정 버튼 1회성 안내. 모바일·데스크톱 툴바에 메뉴가 하나씩 있어 한쪽에서 닫으면
 * 다른 쪽도 함께 사라지도록 localStorage + 커스텀 이벤트로 상태를 공유한다.
 * 서버 렌더에서는 숨긴 상태로 시작해 깜빡임 없이 클라이언트에서만 띄운다.
 */
function useColumnSettingsHint() {
  const dismissed = useSyncExternalStore(subscribeHintDismissed, readHintDismissed, () => true);
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(HINT_DISMISSED_STORAGE_KEY, "true");
    } catch {
      // 저장이 막힌 환경이면 이번 페이지에서만 닫힌다
    }
    window.dispatchEvent(new Event(HINT_DISMISSED_EVENT));
  }, []);
  return { showHint: !dismissed, dismissHint: dismiss };
}

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
  const { showHint, dismissHint } = useColumnSettingsHint();
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
        onClick={() => {
          if (showHint) dismissHint();
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
        aria-label="컬럼 설정"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 5H20M4 5V19M4 5H9.33M20 5V19M20 5H14.67M20 19H4M20 19H14.67M4 19H9.33M9.33 5V19M9.33 5H14.67M9.33 19H14.67M14.67 5V19" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showHint && !open && (
        <div
          role="status"
          className="absolute top-full -right-2 mt-3 z-40 w-max animate-column-settings-hint"
        >
          <span
            className="absolute -top-[5px] right-[15px] w-[10px] h-[10px] rotate-45 rounded-[2px] bg-neutral-90"
            aria-hidden
          />
          <div className="relative flex items-center gap-3 rounded-[8px] bg-neutral-90 pl-3 pr-2 py-2 shadow-lg">
            <span className="text-[13px] leading-[18px] text-neutral-0 whitespace-nowrap">
              컬럼 너비·표시 항목·순서를 바꿀 수 있어요
            </span>
            <button
              type="button"
              onClick={dismissHint}
              className="cursor-pointer shrink-0 h-[26px] px-2.5 rounded-[5px] bg-neutral-0/15 text-[12px] font-semibold text-neutral-0 hover:bg-neutral-0/25 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {!open && !showHint && (
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
              <div className="mt-0.5 text-[12px] text-neutral-60 whitespace-nowrap">표시할 항목을 선택하고 순서를 바꿀 수 있어요.</div>
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
              <div className="flex flex-col gap-0.5 text-[11px] text-neutral-50 leading-[14px] whitespace-nowrap">
                <span>너비는 헤더 경계를 드래그해 조정해요.</span>
                <span>경계를 더블클릭하면 기본 너비로 돌아가요.</span>
              </div>
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
