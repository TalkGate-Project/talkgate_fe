"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getBodyZoom } from "@/utils/zoom";
import { FLIP_COMFORT_MARGIN } from "@/hooks/useAnchoredPanel";
import {
  STATUS_COLOR_PALETTE,
  normalizeHexColor,
} from "@/utils/statusColors";

const PALETTE_COLUMN_COUNT = 4;
const PALETTE_PANEL_WIDTH = 140;
const PALETTE_PANEL_PADDING = 16;
const PALETTE_SWATCH_BUTTON_SIZE = 20;
const PALETTE_SWATCH_ROW_GAP = 12;

function getEstimatedPanelHeight(): number {
  const rowCount = Math.ceil(STATUS_COLOR_PALETTE.length / PALETTE_COLUMN_COUNT);

  return (
    PALETTE_PANEL_PADDING * 2 +
    rowCount * PALETTE_SWATCH_BUTTON_SIZE +
    Math.max(0, rowCount - 1) * PALETTE_SWATCH_ROW_GAP
  );
}


type Props = {
  anchorElement: HTMLElement | null;
  isOpen: boolean;
  selectedColor?: string | null;
  onClose: () => void;
  onSelect: (color: string) => void;
};

type PopoverPosition = {
  top: number;
  left: number;
};

export default function ColorPalettePopover({
  anchorElement,
  isOpen,
  selectedColor,
  onClose,
  onSelect,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const normalizedSelectedColor = useMemo(
    () => normalizeHexColor(selectedColor),
    [selectedColor]
  );

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideAnchor = !!anchorElement?.contains(target);
      const isInsidePanel = !!panelRef.current?.contains(target);

      if (!isInsideAnchor && !isInsidePanel) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleEscape, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [anchorElement, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !anchorElement) return;
    const currentAnchorElement = anchorElement;

    function updatePosition() {
      const anchorRect = currentAnchorElement.getBoundingClientRect();
      const zoom = getBodyZoom();
      // offsetHeight와 CSS 폭 상수는 zoom이 곱해지기 전 레이아웃 px이므로, 화면 px인
      // getBoundingClientRect/innerWidth/innerHeight와 비교하려면 zoom을 곱해 환산한다.
      // 자세한 규칙은 docs/ZOOM_SUBPIXEL_PLAYBOOK.md §4-4 참고.
      const panelHeight = (panelRef.current?.offsetHeight ?? getEstimatedPanelHeight()) * zoom;
      const panelWidth = PALETTE_PANEL_WIDTH * zoom;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gapY = 8;
      const padding = 16;

      // 여유 마진까지 포함해 아래가 부족하고 위는 충분할 때만 위로 띄운다. 딱 들어맞기만
      // 하는 빠듯한 배치보다 위로 올리는 편을 우선한다.
      const requiredSpace = panelHeight + gapY + FLIP_COMFORT_MARGIN;
      let top = (anchorRect.bottom + gapY) / zoom;
      const shouldOpenAbove =
        viewportHeight - anchorRect.bottom < requiredSpace &&
        anchorRect.top > requiredSpace;

      if (shouldOpenAbove) {
        top = (anchorRect.top - panelHeight - gapY) / zoom;
      }

      let left = anchorRect.left / zoom;
      const maxLeft = (viewportWidth - panelWidth - padding) / zoom;
      left = Math.min(left, maxLeft);
      left = Math.max(left, padding / zoom);

      setPosition({ top, left });
    }

    const timer = window.setTimeout(updatePosition, 0);
    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorElement, isOpen]);

  if (!isOpen || !anchorElement || !position) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      data-anchored-panel
      className="fixed z-[1000] w-[140px] rounded-[5px] bg-card shadow-[0px_8px_12px_rgba(9,30,66,0.1)] p-4"
      style={{ top: position.top, left: position.left }}
    >
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {STATUS_COLOR_PALETTE.map((option) => {
          const isSelected = option.backgroundColor === normalizedSelectedColor;

          return (
            <button
              key={option.backgroundColor}
              type="button"
              onClick={() => onSelect(option.backgroundColor)}
              className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-full"
              aria-label={`색상 ${option.backgroundColor}`}
            >
              <span
                className={`block h-[18px] w-[18px] rounded-full ${isSelected ? "ring-2 ring-neutral-90 ring-offset-2 ring-offset-card" : ""}`}
                style={{ backgroundColor: option.paletteDotColor }}
              />
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
