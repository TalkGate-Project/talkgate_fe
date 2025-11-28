"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
};

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  delay = 0.2,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [finalPosition, setFinalPosition] = useState(position);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // 사용자의 요청에 따라 화면을 상하로 양분했을 때
      // 상단에 위치하면 툴팁을 아래로, 하단에 위치하면 툴팁을 위로 띄웁니다.
      if (position === "top" || position === "bottom") {
        // 화면 상단 50% 지점보다 위에 있으면 bottom으로 강제 조정
        if (rect.top < windowHeight / 2) {
          setFinalPosition("bottom");
        } else {
          // 그 외에는 기본적으로 top (또는 원래 bottom이었으면 bottom 유지해도 되지만,
          // 보통 하단에선 위로 띄우는 게 안전하므로 top으로 설정)
          setFinalPosition("top");
        }
      } else {
        setFinalPosition(position);
      }
    } else if (!isVisible) {
      // Reset to prop when closed, though strict reset isn't required
      setFinalPosition(position);
    }
  }, [isVisible, position]);

  // Positioning styles
  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, delay }}
            className={`absolute z-50 whitespace-nowrap px-2 py-1.5 bg-neutral-80 text-white text-[12px] rounded-md shadow-lg pointer-events-none ${positionStyles[finalPosition]}`}
          >
            {content}
            {/* Arrow (optional, simplistic) */}
            <div
              className={`absolute w-2 h-2 bg-neutral-80 rotate-45 ${
                finalPosition === "top"
                  ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                  : finalPosition === "bottom"
                  ? "top-[-4px] left-1/2 -translate-x-1/2"
                  : finalPosition === "left"
                  ? "right-[-4px] top-1/2 -translate-y-1/2"
                  : "left-[-4px] top-1/2 -translate-y-1/2"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
