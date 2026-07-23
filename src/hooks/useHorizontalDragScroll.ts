import { useCallback, useRef } from "react";

// 드래그로 스크롤됐다고 판단하는 최소 이동 거리(px). 이보다 작으면 "클릭"으로 취급한다.
const DRAG_THRESHOLD_PX = 6;

/**
 * 가로 스크롤 컨테이너(overflow-x-auto)에 마우스 드래그로 스크롤할 수 있게 해주는 훅.
 * 태블릿 폭처럼 내용이 잘려 가로 스크롤이 필요한 표에서, 좁은 네이티브 스크롤바를
 * 정확히 조준하지 않아도 셀 영역을 드래그하면 바로 스크롤되게 한다.
 *
 * 드래그가 끝나면 뒤이어 발생하는 click 이벤트(행 클릭 = 상세 이동 등)를 캡처 단계에서
 * 막아준다 — 안 막으면 스크롤하려고 드래그했다가 손을 뗀 시점에 그 자리의 셀이 "클릭"으로
 * 오인돼 의도치 않은 네비게이션이 발생한다. 터치는 브라우저가 스와이프 이후 클릭을 알아서
 * 억제해주므로 마우스 드래그만 다룬다.
 */
export function useHorizontalDragScroll<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const isPointerDownRef = useRef(false);
  const didDragRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent<T>) => {
    // 체크박스·버튼 등 자체 상호작용이 있는 요소 위에서는 드래그 스크롤을 시작하지 않는다.
    if ((e.target as HTMLElement).closest("button, a, input, label")) return;
    if (!containerRef.current) return;

    isPointerDownRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = containerRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!isPointerDownRef.current || !containerRef.current) return;

    const delta = e.pageX - startXRef.current;
    if (!didDragRef.current && Math.abs(delta) < DRAG_THRESHOLD_PX) return;

    if (!didDragRef.current) {
      didDragRef.current = true;
      containerRef.current.style.cursor = "grabbing";
      containerRef.current.style.userSelect = "none";
    }

    e.preventDefault();
    containerRef.current.scrollLeft = startScrollLeftRef.current - delta;
  }, []);

  const endDrag = useCallback(() => {
    isPointerDownRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "";
      containerRef.current.style.userSelect = "";
    }
  }, []);

  // 임계값을 넘긴 드래그였다면 바로 뒤따르는 click을 캡처 단계에서 소비해 하위 onClick(행 클릭
  // 등)까지 전파되지 않게 막는다. 임계값 미만이면 didDragRef가 false로 남아 정상 클릭으로 통과.
  const handleClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;
    }
  }, []);

  return {
    containerRef,
    dragScrollHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: endDrag,
      onMouseLeave: endDrag,
      onClickCapture: handleClickCapture,
    },
  };
}
