"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggableFloatingWindow } from "@/hooks/useDraggableFloatingWindow";
import { useResizableFloatingWindow } from "@/hooks/useResizableFloatingWindow";
import { getBodyZoom } from "@/utils/zoom";
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
const HEADER_HEIGHT = 54;
// 좌우로는 창을 화면 밖으로 거의 다 밀어낼 수 있게 하되, 다시 끌어올 손잡이로 이만큼은 남긴다.
const MIN_VISIBLE_WIDTH_RATIO = 0.1;

/**
 * 창의 left/top/width/height는 zoom이 걸린 body 안의 **레이아웃 px**이다. `window.innerWidth`는
 * zoom이 곱해진 **화면 px**이라 그대로 비교하면 창이 화면 폭의 zoom배(0.8) 지점에서 막힌다.
 * zoom으로 나눠 레이아웃 px로 맞춘 뒤 비교한다. (`docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4)
 */
function getViewportInLayoutPx(): { width: number; height: number } {
  const zoom = getBodyZoom();
  return { width: window.innerWidth / zoom, height: window.innerHeight / zoom };
}

function getDefaultBounds(): Bounds {
  if (typeof window === "undefined") {
    return { left: 0, top: HEADER_HEIGHT, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  }
  const viewport = getViewportInLayoutPx();
  const width = Math.min(DEFAULT_WIDTH, viewport.width - EDGE_GAP * 2);
  const height = Math.min(DEFAULT_HEIGHT, viewport.height - HEADER_HEIGHT - EDGE_GAP);
  return {
    // 입력 폼이 화면 가운데에 있어서 오른쪽 여백에 붙여 띄운다.
    left: Math.max(EDGE_GAP, viewport.width - width - EDGE_GAP),
    top: HEADER_HEIGHT,
    width,
    height,
  };
}

function clampBounds(bounds: Bounds): Bounds {
  if (typeof window === "undefined") return bounds;
  const viewport = getViewportInLayoutPx();
  const width = Math.min(Math.max(bounds.width, Math.min(MIN_WIDTH, viewport.width)), viewport.width);
  const height = Math.min(Math.max(bounds.height, Math.min(MIN_HEIGHT, viewport.height)), viewport.height);
  // 가로는 창의 10%만 화면 안에 있으면 된다(오른쪽으로 밀면 왼쪽 10%가, 왼쪽으로 밀면
  // 오른쪽 10%가 남는다). 세로는 헤더가 드래그 손잡이라 화면 안에 그대로 묶어둔다.
  const visibleWidth = width * MIN_VISIBLE_WIDTH_RATIO;
  return {
    width,
    height,
    left: Math.min(Math.max(bounds.left, visibleWidth - width), viewport.width - visibleWidth),
    top: Math.min(Math.max(bounds.top, 0), Math.max(0, viewport.height - height)),
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
  // 사용자가 직접 옮기거나 크기를 바꾼 뒤에는 다시 열어도 그 자리를 유지한다.
  const hasUserAdjustedRef = useRef(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT_PX);
      setBounds((current) => clampBounds(current));
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // 마운트 시점이 아니라 열리는 시점의 화면 크기로 자리를 잡는다.
  useEffect(() => {
    if (!open || hasUserAdjustedRef.current) return;
    setBounds(clampBounds(getDefaultBounds()));
  }, [open]);

  const setPosition = useCallback((position: { left: number; top: number }) => {
    hasUserAdjustedRef.current = true;
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
  const updateBounds = useCallback((next: Bounds) => {
    hasUserAdjustedRef.current = true;
    setBounds(clampBounds(next));
  }, []);
  const clampNextBounds = useCallback((next: Bounds) => clampBounds(next), []);

  const { handlePointerDown: handleHeaderPointerDown } = useDraggableFloatingWindow({
    position: bounds,
    onChangePosition: setPosition,
    clampPosition,
    getPointerScale: getBodyZoom,
  });
  const leftResize = useResizableFloatingWindow({ mode: "left", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds, getPointerScale: getBodyZoom });
  const rightResize = useResizableFloatingWindow({ mode: "right", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds, getPointerScale: getBodyZoom });
  const bottomResize = useResizableFloatingWindow({ mode: "bottom", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds, getPointerScale: getBodyZoom });
  const bottomLeftResize = useResizableFloatingWindow({ mode: "bottom-left", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds, getPointerScale: getBodyZoom });
  const bottomRightResize = useResizableFloatingWindow({ mode: "bottom-right", bounds, onChangeBounds: updateBounds, clampBounds: clampNextBounds, getPointerScale: getBodyZoom });

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
      // 이 창은 채무조정 진단 화면 위에서만 열리므로 진단 정보 섹션은 중복이다.
      hideLinkedAnalysis
      floatingPresentation={{
        positionerClassName: isMobileViewport ? "absolute inset-0" : "absolute",
        positionerStyle: isMobileViewport
          ? undefined
          : { left: bounds.left, top: Math.max(0, bounds.top) },
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
