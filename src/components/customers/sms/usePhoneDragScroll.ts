import { useState, useRef, useCallback } from "react";

export function usePhoneDragScroll() {
  const phoneScreenRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // 마우스 드래그 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!phoneScreenRef.current) return;
      setIsDragging(true);
      setStartY(e.pageY - phoneScreenRef.current.offsetTop);
      setScrollTop(phoneScreenRef.current.scrollTop);
      phoneScreenRef.current.style.cursor = "grabbing";
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !phoneScreenRef.current) return;
      e.preventDefault();
      const y = e.pageY - phoneScreenRef.current.offsetTop;
      const walk = (y - startY) * 1.5;
      phoneScreenRef.current.scrollTop = scrollTop - walk;
    },
    [isDragging, startY, scrollTop]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (phoneScreenRef.current) {
      phoneScreenRef.current.style.cursor = "grab";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (phoneScreenRef.current) {
        phoneScreenRef.current.style.cursor = "grab";
      }
    }
  }, [isDragging]);

  // 터치 스크롤 핸들러
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!phoneScreenRef.current) return;
      setIsDragging(true);
      setStartY(e.touches[0].pageY - phoneScreenRef.current.offsetTop);
      setScrollTop(phoneScreenRef.current.scrollTop);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging || !phoneScreenRef.current) return;
      const y = e.touches[0].pageY - phoneScreenRef.current.offsetTop;
      const walk = (y - startY) * 1.5;
      phoneScreenRef.current.scrollTop = scrollTop - walk;
    },
    [isDragging, startY, scrollTop]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    phoneScreenRef,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

