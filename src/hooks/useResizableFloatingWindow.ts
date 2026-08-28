"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

type Bounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ResizeMode = "left" | "right" | "bottom" | "bottom-left" | "bottom-right";

type UseResizableFloatingWindowOptions = {
  mode: ResizeMode;
  bounds: Bounds;
  onChangeBounds: (next: Bounds) => void;
  clampBounds: (next: Bounds) => Bounds;
  /**
   * 포인터 이동량(화면 px)을 `bounds`가 쓰는 좌표계(레이아웃 px)로 나눌 배율.
   * body에 zoom이 걸린 화면에서 `getBodyZoom`을 넘기면 모서리가 커서를 1:1로 따라온다.
   * 넘기지 않으면 변환 없이 화면 px를 그대로 쓴다(기존 동작).
   * 규칙은 `docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4 참고.
   */
  getPointerScale?: () => number;
};

export function useResizableFloatingWindow({
  mode,
  bounds,
  onChangeBounds,
  clampBounds,
  getPointerScale,
}: UseResizableFloatingWindowOptions) {
  const resizeStateRef = useRef<{
    startX: number;
    startY: number;
    initialBounds: Bounds;
    scale: number;
  } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      e.preventDefault();

      const deltaX = (e.clientX - resizeState.startX) / resizeState.scale;
      const deltaY = (e.clientY - resizeState.startY) / resizeState.scale;
      const initialBounds = resizeState.initialBounds;
      const initialRight = initialBounds.left + initialBounds.width;
      let nextBounds: Bounds;

      if (mode === "left") {
        const nextWidth = initialBounds.width - deltaX;
        const clampedWidthBounds = clampBounds({
          ...initialBounds,
          width: nextWidth,
        });
        nextBounds = {
          ...initialBounds,
          left: initialRight - clampedWidthBounds.width,
          width: clampedWidthBounds.width,
        };
      } else if (mode === "right") {
        nextBounds = {
          ...initialBounds,
          width: initialBounds.width + deltaX,
        };
      } else if (mode === "bottom") {
        nextBounds = {
          ...initialBounds,
          height: initialBounds.height + deltaY,
        };
      } else if (mode === "bottom-left") {
        const nextWidth = initialBounds.width - deltaX;
        const clampedWidthBounds = clampBounds({
          ...initialBounds,
          width: nextWidth,
        });
        nextBounds = {
          ...initialBounds,
          left: initialRight - clampedWidthBounds.width,
          width: clampedWidthBounds.width,
          height: initialBounds.height + deltaY,
        };
      } else {
        nextBounds = {
          ...initialBounds,
          width: initialBounds.width + deltaX,
          height: initialBounds.height + deltaY,
        };
      }

      onChangeBounds(clampBounds(nextBounds));
    },
    [clampBounds, mode, onChangeBounds]
  );

  const stopResizing = useCallback(() => {
    resizeStateRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopResizing);
    window.removeEventListener("pointercancel", stopResizing);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const scale = getPointerScale?.() ?? 1;
      resizeStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialBounds: bounds,
        scale: scale > 0 ? scale : 1,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor =
        mode === "bottom-right"
          ? "nwse-resize"
          : mode === "bottom-left"
            ? "nesw-resize"
          : mode === "bottom"
            ? "ns-resize"
            : "ew-resize";
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", stopResizing);
      window.addEventListener("pointercancel", stopResizing);
    },
    [bounds, getPointerScale, handlePointerMove, mode, stopResizing]
  );

  useEffect(() => stopResizing, [stopResizing]);

  return { handlePointerDown };
}
