"use client";

import { useCallback, useEffect, useState } from "react";
import { useDraggableFloatingWindow } from "@/hooks/useDraggableFloatingWindow";
import { useResizableFloatingWindow } from "@/hooks/useResizableFloatingWindow";
import CustomerDetailModalMobile from "./CustomerDetailModalMobile";

type Bounds = { left: number; top: number; width: number; height: number };

type Props = {
  open: boolean;
  customerId: number | null;
  onClose: () => void;
  onCustomerUpdated?: () => void;
};

const MOBILE_BREAKPOINT_PX = 780;
const DEFAULT_WIDTH = 430;
const DEFAULT_HEIGHT = 720;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 520;
const EDGE_GAP = 24;

function getDefaultBounds(): Bounds {
  if (typeof window === "undefined") {
    return { left: 0, top: 54, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  }
  const width = Math.min(DEFAULT_WIDTH, window.innerWidth - EDGE_GAP * 2);
  const height = Math.min(DEFAULT_HEIGHT, window.innerHeight - 54 - EDGE_GAP);
  return {
    left: Math.max(EDGE_GAP, window.innerWidth - width - 40),
    top: 54,
    width,
    height,
  };
}

function clampBounds(bounds: Bounds): Bounds {
  if (typeof window === "undefined") return bounds;
  const width = Math.min(Math.max(bounds.width, Math.min(MIN_WIDTH, window.innerWidth)), window.innerWidth);
  const height = Math.min(Math.max(bounds.height, Math.min(MIN_HEIGHT, window.innerHeight)), window.innerHeight);
  return {
    width,
    height,
    left: Math.min(Math.max(bounds.left, 0), Math.max(0, window.innerWidth - width)),
    top: Math.min(Math.max(bounds.top, 0), Math.max(0, window.innerHeight - height)),
  };
}

export default function FloatingCustomerDetailModal({
  open,
  customerId,
  onClose,
  onCustomerUpdated,
}: Props) {
  const [bounds, setBounds] = useState<Bounds>(getDefaultBounds);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT_PX);
      setBounds((current) => clampBounds(current));
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const setPosition = useCallback((position: { left: number; top: number }) => {
    setBounds((current) => clampBounds({ ...current, ...position }));
  }, []);
  const windowWidth = bounds.width;
  const windowHeight = bounds.height;
  const clampPosition = useCallback(
    (position: { left: number; top: number }) => {
      const next = clampBounds({ ...position, width: windowWidth, height: windowHeight });
      return { left: next.left, top: next.top };
    },
    [windowWidth, windowHeight]
  );
  const updateBounds = useCallback((next: Bounds) => setBounds(clampBounds(next)), []);
  const clampNextBounds = useCallback((next: Bounds) => clampBounds(next), []);

  const { handlePointerDown: handleHeaderPointerDown } = useDraggableFloatingWindow({
    position: bounds,
    onChangePosition: setPosition,
    clampPosition,
  });
  const leftResize = useResizableFloatingWindow({ mode: "left", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds });
  const rightResize = useResizableFloatingWindow({ mode: "right", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds });
  const bottomResize = useResizableFloatingWindow({ mode: "bottom", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds });
  const bottomLeftResize = useResizableFloatingWindow({ mode: "bottom-left", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds });
  const bottomRightResize = useResizableFloatingWindow({ mode: "bottom-right", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds });

  const resizeHandles = !isMobileViewport ? (
    <>
      <div aria-hidden className="absolute left-0 top-0 z-40 h-[calc(100%-14px)] w-2 cursor-ew-resize touch-none" onPointerDown={leftResize.handlePointerDown} />
      <div aria-hidden className="absolute right-0 top-0 z-40 h-[calc(100%-14px)] w-2 cursor-ew-resize touch-none" onPointerDown={rightResize.handlePointerDown} />
      <div aria-hidden className="absolute bottom-0 left-[14px] z-40 h-2 w-[calc(100%-28px)] cursor-ns-resize touch-none" onPointerDown={bottomResize.handlePointerDown} />
      <div aria-hidden className="absolute bottom-0 left-0 z-50 h-4 w-4 cursor-nesw-resize touch-none" onPointerDown={bottomLeftResize.handlePointerDown} />
      <div aria-hidden className="absolute bottom-0 right-0 z-50 h-4 w-4 cursor-nwse-resize touch-none" onPointerDown={bottomRightResize.handlePointerDown} />
    </>
  ) : undefined;

  if (!open || customerId == null) return null;

  return (
    <CustomerDetailModalMobile
      open
      customerId={customerId}
      onClose={onClose}
      onCustomerUpdated={onCustomerUpdated}
      floatingPresentation={{
        positionerClassName: isMobileViewport ? "absolute inset-0" : "absolute",
        positionerStyle: isMobileViewport ? undefined : { left: bounds.left, top: bounds.top },
        containerClassName: isMobileViewport
          ? "pointer-events-auto h-full w-full overflow-hidden bg-card dark:bg-neutral-10"
          : "pointer-events-auto overflow-hidden rounded-[16px] bg-card shadow-[0_18px_40px_rgba(9,30,66,0.18)] dark:bg-neutral-10",
        contentStyle: isMobileViewport ? undefined : { width: bounds.width, height: bounds.height },
        onHeaderPointerDown: isMobileViewport ? undefined : handleHeaderPointerDown,
        resizeHandles,
      }}
    />
  );
}
