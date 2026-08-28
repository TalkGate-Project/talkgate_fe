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
  /**
   * 포인터 좌표(화면 px)를 `position`이 쓰는 좌표계(레이아웃 px)로 나눌 배율.
   * body에 zoom이 걸린 화면에서 `getBodyZoom`을 넘기면 창이 커서를 1:1로 따라온다.
   * 넘기지 않으면 변환 없이 화면 px를 그대로 쓴다(기존 동작).
   * 규칙은 `docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4 참고.
   */
  getPointerScale?: () => number;
};

const DEFAULT_IGNORE_SELECTOR = "button, a, input, textarea, select, label, [data-no-drag='true']";

export function useDraggableFloatingWindow({
  position,
  onChangePosition,
  clampPosition,
  ignoreSelector = DEFAULT_IGNORE_SELECTOR,
  getPointerScale,
}: UseDraggableFloatingWindowOptions) {
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    scale: number;
  } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      e.preventDefault();
      onChangePosition(
        clampPosition({
          left: dragState.startLeft + (e.clientX - dragState.startX) / dragState.scale,
          top: dragState.startTop + (e.clientY - dragState.startY) / dragState.scale,
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

      const scale = getPointerScale?.() ?? 1;
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: position.left,
        startTop: position.top,
        scale: scale > 0 ? scale : 1,
      };

      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", stopDragging);
      window.addEventListener("pointercancel", stopDragging);
    },
    [getPointerScale, handlePointerMove, ignoreSelector, position.left, position.top, stopDragging]
  );

  useEffect(() => stopDragging, [stopDragging]);

  return { handlePointerDown };
}

