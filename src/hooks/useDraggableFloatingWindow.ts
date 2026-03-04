"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

type Position = {
  left: number;
  top: number;
};

type UseDraggableFloatingWindowOptions = {
  position: Position;
  onChangePosition: (next: Position) => void;
  clampPosition: (next: Position) => Position;
  ignoreSelector?: string;
};

const DEFAULT_IGNORE_SELECTOR = "button, a, input, textarea, select, label, [data-no-drag='true']";

export function useDraggableFloatingWindow({
  position,
  onChangePosition,
  clampPosition,
  ignoreSelector = DEFAULT_IGNORE_SELECTOR,
}: UseDraggableFloatingWindowOptions) {
  const dragStateRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      e.preventDefault();
      onChangePosition(
        clampPosition({
          left: e.clientX - dragState.offsetX,
          top: e.clientY - dragState.offsetY,
        })
      );
    },
    [clampPosition, onChangePosition]
  );

  const stopDragging = useCallback(() => {
    dragStateRef.current = null;
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", stopDragging);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest(ignoreSelector)) return;

      dragStateRef.current = {
        offsetX: e.clientX - position.left,
        offsetY: e.clientY - position.top,
      };

      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", stopDragging);
      window.addEventListener("pointercancel", stopDragging);
    },
    [handlePointerMove, ignoreSelector, position.left, position.top, stopDragging]
  );

  useEffect(() => stopDragging, [stopDragging]);

  return { handlePointerDown };
}

