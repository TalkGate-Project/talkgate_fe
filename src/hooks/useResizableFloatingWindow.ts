"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

type Size = {
  width: number;
  height: number;
};

type ResizeAxis = "horizontal" | "vertical";

type UseResizableFloatingWindowOptions = {
  axis: ResizeAxis;
  size: Size;
  onChangeSize: (next: Size) => void;
  clampSize: (next: Size) => Size;
};

export function useResizableFloatingWindow({
  axis,
  size,
  onChangeSize,
  clampSize,
}: UseResizableFloatingWindowOptions) {
  const resizeStateRef = useRef<{ startX: number; startY: number; initialSize: Size } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      e.preventDefault();

      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;
      const nextSize =
        axis === "horizontal"
          ? {
              ...resizeState.initialSize,
              width: resizeState.initialSize.width + deltaX,
            }
          : {
              ...resizeState.initialSize,
              height: resizeState.initialSize.height + deltaY,
            };

      onChangeSize(clampSize(nextSize));
    },
    [axis, clampSize, onChangeSize]
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
        initialSize: size,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = axis === "horizontal" ? "ew-resize" : "ns-resize";
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", stopResizing);
      window.addEventListener("pointercancel", stopResizing);
    },
    [axis, handlePointerMove, size, stopResizing]
  );

  useEffect(() => stopResizing, [stopResizing]);

  return { handlePointerDown };
}
