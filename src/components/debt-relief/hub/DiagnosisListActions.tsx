"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  hasSelection: boolean;
  selectedCount: number;
  limit: number;
  onDelete: () => void;
  onShare: () => void;
  /** 영업점(analysis)에서만 선택 공유 버튼 표시 */
  showShareAction?: boolean;
  onLimitChange: (limit: number) => void;
};

const ICON_BTN =
  "cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const LIMIT_OPTIONS = [10, 20, 30, 50, 100];

function IconTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisListActions({
  hasSelection,
  selectedCount,
  limit,
  onDelete,
  onShare,
  showShareAction = true,
  onLimitChange,
}: Props) {
  const [limitOpen, setLimitOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!limitOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setLimitOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [limitOpen]);

  return (
    <div className="flex items-center gap-3">
      <IconTooltip label="선택 삭제">
        <button
          type="button"
          onClick={onDelete}
          disabled={!hasSelection}
          className={ICON_BTN}
          aria-label={`선택한 ${selectedCount}건 삭제`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
              d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </IconTooltip>

      {showShareAction && (
        <IconTooltip label="선택 공유">
          <button
            type="button"
            onClick={onShare}
            disabled={!hasSelection}
            className={ICON_BTN}
            aria-label={`선택한 ${selectedCount}건 공유`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M8.68387 13.3419C8.88616 12.9381 9 12.4824 9 12C9 11.5176 8.88616 11.0619 8.68387 10.6581M8.68387 13.3419C8.19134 14.3251 7.17449 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.17449 9 8.19134 9.67492 8.68387 10.6581M8.68387 13.3419L15.3161 16.6581M8.68387 10.6581L15.3161 7.34193M15.3161 7.34193C15.8087 8.32508 16.8255 9 18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 6.48237 15.1138 6.93815 15.3161 7.34193ZM15.3161 16.6581C15.1138 17.0619 15 17.5176 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C16.8255 15 15.8087 15.6749 15.3161 16.6581Z"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </IconTooltip>
      )}

      <div className="relative h-6" ref={popoverRef}>
        <IconTooltip label="목록 개수">
          <button
            type="button"
            onClick={() => setLimitOpen((prev) => !prev)}
            className={ICON_BTN}
            aria-label="목록 개수"
            aria-haspopup="menu"
            aria-expanded={limitOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M3 4H16M3 8H12M3 12H12M17 8V20M21 16L17 20L13 16"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </IconTooltip>
        {limitOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-[105px] rounded-[8px] bg-card border border-neutral-30 shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] dark:shadow-[0px_8px_16px_rgba(0,0,0,0.45)] z-50 overflow-hidden"
          >
            {LIMIT_OPTIONS.map((option) => {
              const isSelected = limit === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    onLimitChange(option);
                    setLimitOpen(false);
                  }}
                  className={`cursor-pointer w-full h-[49px] px-5 text-left text-[14px] font-medium tracking-[-0.02em] text-neutral-90 transition-colors ${
                    isSelected ? "bg-neutral-20" : "bg-card hover:bg-neutral-10"
                  }`}
                >
                  {option}개씩
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
