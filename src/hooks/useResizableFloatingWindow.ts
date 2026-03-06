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
};

export function useResizableFloatingWindow({
  mode,
  bounds,
  onChangeBounds,
  clampBounds,
}: UseResizableFloatingWindowOptions) {
  const resizeStateRef = useRef<{ startX: number; startY: number; initialBounds: Bounds } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      e.preventDefault();

      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;
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

      resizeStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialBounds: bounds,
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
    [bounds, handlePointerMove, mode, stopResizing]
  );

  useEffect(() => stopResizing, [stopResizing]);

  return { handlePointerDown };
}
