import { RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getBadgeStyle } from "@/utils/categoryBadge";

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
};

function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  const rawZoom = String(((document.body.style as any).zoom ?? "") as string).trim();
  const parsedZoom = Number.parseFloat(rawZoom);
  return Number.isFinite(parsedZoom) && parsedZoom > 0 ? parsedZoom : 1;
}

export default function CategoryDropdownPortal({
  open,
  anchorRef,
  dropdownRef,
  options,
  selectedCategoryId,
  disabled = false,
  onSelect,
}: Props) {
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const dropdownVerticalPadding = 24;

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
      const dropdownWidth = Math.max(triggerWidth, 240);
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
      className="fixed z-[220] w-[280px] rounded-[12px] border border-[#E2E2E2] bg-card p-3 shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:border-neutral-30 dark:bg-neutral-10"
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
        className="space-y-1 overflow-y-auto"
        style={{
          maxHeight: Math.max(position.maxHeight - dropdownVerticalPadding, 0),
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
              className="flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left hover:bg-neutral-10 dark:hover:bg-neutral-20 disabled:opacity-60"
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
    </div>,
    document.body
  );
}
