import { RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { getBodyZoom } from "@/utils/zoom";

type CategoryOption = {
  id: number | null;
  name: string;
  colorCode?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openAbove: boolean;
};

type Props = {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  options: CategoryOption[];
  selectedCategoryId: number | null;
  disabled?: boolean;
  onSelect: (categoryId: number | null) => void;
  showManageButton?: boolean;
  onManageButtonClick?: () => void;
};

export default function CategoryDropdownPortal({
  open,
  anchorRef,
  dropdownRef,
  options,
  selectedCategoryId,
  disabled = false,
  onSelect,
  showManageButton = false,
  onManageButtonClick,
}: Props) {
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const dropdownVerticalPadding = 24;
  const manageButtonSectionHeight = showManageButton ? 50 : 0;

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current) return;

      const zoom = getBodyZoom();
      const triggerRect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth / zoom;
      const viewportHeight = window.innerHeight / zoom;
      const triggerTop = triggerRect.top / zoom;
      const triggerBottom = triggerRect.bottom / zoom;
      const triggerLeft = triggerRect.left / zoom;
      const triggerWidth = triggerRect.width / zoom;
      const dropdownWidth = Math.max(triggerWidth, 160);
      const horizontalPadding = 16;
      const verticalOffset = 8;
      const spaceBelow = viewportHeight - triggerBottom - horizontalPadding;
      const spaceAbove = triggerTop - horizontalPadding;
      const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      const availableHeight = openAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(Math.min(availableHeight, 280), 140);
      const maxLeft = Math.max(horizontalPadding, viewportWidth - dropdownWidth - horizontalPadding);
      const left = Math.min(Math.max(horizontalPadding, triggerLeft), maxLeft);

      setPosition({
        top: openAbove ? triggerTop - verticalOffset : triggerBottom + verticalOffset,
        left,
        width: dropdownWidth,
        maxHeight,
        openAbove,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, options.length]);

  if (!open || !position || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[220] rounded-[5px] border border-[#E2E2E2] bg-card p-0 shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:border-neutral-30 dark:bg-neutral-10"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        overflow: "hidden",
        transform: position.openAbove ? "translateY(-100%)" : undefined,
      }}
    >
      <div
        className="overflow-y-auto p-3"
        style={{
          maxHeight: Math.max(
            position.maxHeight - dropdownVerticalPadding - manageButtonSectionHeight,
            0
          ),
        }}
      >
        {options.map((categoryOption) => {
          const badgeStyle = getBadgeStyle(
            categoryOption.name,
            categoryOption.id ?? 0,
            categoryOption.colorCode
          );
          const isSelected = categoryOption.id === selectedCategoryId;

          return (
            <button
              key={categoryOption.id ?? "none"}
              type="button"
              className="flex w-full items-center gap-2 rounded-[5px] px-3 py-[10px] text-left hover:bg-neutral-10 dark:hover:bg-neutral-20 disabled:opacity-60"
              onClick={() => onSelect(categoryOption.id)}
              disabled={disabled}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    typeof badgeStyle.color === "string" ? badgeStyle.color : undefined,
                }}
              />
              <span className="flex-1 truncate text-[14px] font-medium text-foreground">
                {categoryOption.name}
              </span>
              {isSelected && (
                <span className="text-[12px] text-neutral-60">선택됨</span>
              )}
            </button>
          );
        })}
      </div>
      {showManageButton && onManageButtonClick && (
        <div className="border-t border-[#E2E2E2]/50 px-3 py-3 dark:border-neutral-30/70">
          <button
            type="button"
            className="cursor-pointer flex w-full items-center gap-2 rounded-[5px] px-2 py-1 text-left text-[13px] font-medium text-neutral-60 transition-colors hover:bg-neutral-10 hover:text-neutral-70 dark:text-neutral-50 dark:hover:bg-neutral-20 dark:hover:text-neutral-40"
            onClick={onManageButtonClick}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                d="M8.60386 3.59776C8.95919 2.13408 11.0408 2.13408 11.3961 3.59776C11.6257 4.54327 12.709 4.99198 13.5398 4.48571C14.8261 3.70199 16.298 5.17392 15.5143 6.46015C15.008 7.29105 15.4567 8.37431 16.4022 8.60386C17.8659 8.95919 17.8659 11.0408 16.4022 11.3961C15.4567 11.6257 15.008 12.709 15.5143 13.5398C16.298 14.8261 14.8261 16.298 13.5398 15.5143C12.709 15.008 11.6257 15.4567 11.3961 16.4022C11.0408 17.8659 8.95919 17.8659 8.60386 16.4022C8.37431 15.4567 7.29105 15.008 6.46016 15.5143C5.17392 16.298 3.70199 14.8261 4.48571 13.5398C4.99198 12.709 4.54327 11.6257 3.59776 11.3961C2.13408 11.0408 2.13408 8.95919 3.59776 8.60386C4.54327 8.37431 4.99198 7.29105 4.48571 6.46015C3.70199 5.17392 5.17392 3.70199 6.46015 4.48571C7.29105 4.99198 8.37431 4.54327 8.60386 3.59776Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10C7.5 8.61929 8.61929 7.5 10 7.5C11.3807 7.5 12.5 8.61929 12.5 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="truncate">카테고리 설정하기</span>
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
