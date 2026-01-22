"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

function getBodyZoom(): number {
  if (typeof window === "undefined") return 1;
  const raw = String(((document.body.style as any).zoom ?? "") as string).trim();
  if (!raw) return 1;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? 1 : parsed;
}

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
  multiline?: boolean;
  maxWidth?: string;
};

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  delay = 0.2,
  multiline = false,
  maxWidth = "300px",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [finalPosition, setFinalPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const lastCheckedPositionRef = useRef<string | null>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

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
        // left/right의 경우는 기본값으로 설정하고, 실제 렌더링 후 경계 체크에서 조정
        setFinalPosition(position);
      }
    } else if (!isVisible) {
      // Reset to prop when closed, though strict reset isn't required
      setFinalPosition(position);
    }
  }, [isVisible, position]);

  // 툴팁 위치 계산 및 스타일 업데이트 (Portal 사용 시)
  useEffect(() => {
    if (!isVisible || !containerRef.current) {
      setTooltipStyle({});
      lastCheckedPositionRef.current = null;
      return;
    }

    const updateTooltipPosition = () => {
      if (!containerRef.current) return;

      const zoom = getBodyZoom();
      const containerRect = containerRef.current.getBoundingClientRect();
      // zoom을 고려하여 실제 뷰포트 크기 계산
      const windowWidth = window.innerWidth / zoom;
      const windowHeight = window.innerHeight / zoom;
      const padding = 8;
      const gap = 8; // 툴팁과 요소 사이의 간격

      // 툴팁이 실제로 렌더링되어 있는 경우 정확한 크기 사용
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        // zoom을 고려하여 실제 크기 계산
        const tooltipWidth = tooltipRect.width / zoom;
        const tooltipHeight = tooltipRect.height / zoom;

        let top = 0;
        let left = 0;
        let transform = "";
        let needsPositionChange = false;
        let newPosition = finalPosition;

        // zoom을 고려하여 실제 위치 계산 (getBoundingClientRect는 zoom이 적용된 값을 반환하므로 나눠줌)
        const containerTop = containerRect.top / zoom;
        const containerLeft = containerRect.left / zoom;
        const containerRight = containerRect.right / zoom;
        const containerBottom = containerRect.bottom / zoom;
        const containerCenterX = containerLeft + containerRect.width / zoom / 2;
        const containerCenterY = containerTop + containerRect.height / zoom / 2;

        // 현재 위치에 따라 계산
        if (finalPosition === "top") {
          top = containerTop - tooltipHeight - gap;
          left = containerCenterX;
          transform = "translateX(-50%)";
          
          // 화면 밖으로 나가면 위치 조정
          if (top < padding) {
            needsPositionChange = true;
            newPosition = "bottom";
          }
        } else if (finalPosition === "bottom") {
          top = containerBottom + gap;
          left = containerCenterX;
          transform = "translateX(-50%)";
          
          if (top + tooltipHeight > windowHeight - padding) {
            needsPositionChange = true;
            newPosition = "top";
          }
        } else if (finalPosition === "left") {
          top = containerCenterY;
          left = containerLeft - tooltipWidth - gap;
          transform = "translateY(-50%)";
          
          if (left < padding) {
            needsPositionChange = true;
            newPosition = "right";
          }
        } else if (finalPosition === "right") {
          top = containerCenterY;
          left = containerRight + gap;
          transform = "translateY(-50%)";
          
          if (left + tooltipWidth > windowWidth - padding) {
            needsPositionChange = true;
            newPosition = "left";
          }
        }

        // 위치 변경이 필요한 경우
        if (needsPositionChange && lastCheckedPositionRef.current !== finalPosition) {
          lastCheckedPositionRef.current = finalPosition;
          setFinalPosition(newPosition);
          return; // 다음 렌더링에서 재계산
        }

        // 최종 위치 재계산 (위치 변경 후)
        if (needsPositionChange) {
          if (newPosition === "top") {
            top = containerTop - tooltipHeight - gap;
            left = containerCenterX;
            transform = "translateX(-50%)";
          } else if (newPosition === "bottom") {
            top = containerBottom + gap;
            left = containerCenterX;
            transform = "translateX(-50%)";
          } else if (newPosition === "left") {
            top = containerCenterY;
            left = containerLeft - tooltipWidth - gap;
            transform = "translateY(-50%)";
          } else if (newPosition === "right") {
            top = containerCenterY;
            left = containerRight + gap;
            transform = "translateY(-50%)";
          }
        }

        // 화면 경계 내로 조정 (transform 적용 전 위치)
        if (finalPosition === "top" || finalPosition === "bottom" || needsPositionChange) {
          // 좌우 경계 체크
          const halfWidth = tooltipWidth / 2;
          left = Math.max(padding + halfWidth, Math.min(left, windowWidth - padding - halfWidth));
        } else {
          // 상하 경계 체크
          const halfHeight = tooltipHeight / 2;
          top = Math.max(padding + halfHeight, Math.min(top, windowHeight - padding - halfHeight));
        }

        lastCheckedPositionRef.current = finalPosition;
        // fixed positioning 사용 시 zoom으로 나눈 값을 그대로 사용 (DatePicker 패턴 참고)
        setTooltipStyle({
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          transform,
        });
      } else {
        // 툴팁이 아직 렌더링되지 않은 경우, 다음 프레임에 다시 시도
        const rafId = requestAnimationFrame(() => {
          updateTooltipPosition();
        });
        return () => cancelAnimationFrame(rafId);
      }
    };

    // requestAnimationFrame을 사용하여 다음 프레임에 계산
    const rafId = requestAnimationFrame(() => {
      updateTooltipPosition();
    });

    return () => cancelAnimationFrame(rafId);
  }, [isVisible, finalPosition]);

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, delay }}
          className={`z-[9999] px-3 py-2.5 bg-neutral-90 dark:bg-neutral-10 text-white text-[13px] rounded-lg shadow-xl pointer-events-none ${
            multiline 
              ? "whitespace-normal break-words" 
              : "whitespace-nowrap"
          }`}
          style={{
            ...tooltipStyle,
            maxWidth: multiline ? maxWidth : undefined,
            lineHeight: multiline ? "1.6" : undefined,
          }}
        >
          {content}

        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {typeof window !== "undefined" && createPortal(tooltipContent, document.body)}
    </>
  );
}
