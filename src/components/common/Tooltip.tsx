"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getBodyZoom } from "@/utils/zoom";


type TooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  align?: "center" | "start";
  className?: string;
  delay?: number;
  multiline?: boolean;
  maxWidth?: string;
  disablePortal?: boolean;
  gap?: number;
};

export default function Tooltip({
  content,
  children,
  position = "top",
  align = "center",
  className = "",
  delay = 0.2,
  multiline = false,
  maxWidth = "300px",
  disablePortal = false,
  gap = 8,
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
    if (disablePortal) {
      setTooltipStyle({});
      lastCheckedPositionRef.current = null;
      return;
    }

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

        const getPositionStyles = (nextPosition: typeof finalPosition) => {
          if (nextPosition === "top") {
            return {
              top: containerTop - tooltipHeight - gap,
              left: align === "start" ? containerLeft : containerCenterX,
              transform: align === "start" ? "" : "translateX(-50%)",
            };
          }

          if (nextPosition === "bottom") {
            return {
              top: containerBottom + gap,
              left: align === "start" ? containerLeft : containerCenterX,
              transform: align === "start" ? "" : "translateX(-50%)",
            };
          }

          if (nextPosition === "left") {
            return {
              top: align === "start" ? containerTop : containerCenterY,
              left: containerLeft - tooltipWidth - gap,
              transform: align === "start" ? "" : "translateY(-50%)",
            };
          }

          return {
            top: align === "start" ? containerTop : containerCenterY,
            left: containerRight + gap,
            transform: align === "start" ? "" : "translateY(-50%)",
          };
        };

        // 현재 위치에 따라 계산
        if (finalPosition === "top") {
          ({ top, left, transform } = getPositionStyles("top"));

          // 화면 밖으로 나가면 위치 조정
          if (top < padding) {
            needsPositionChange = true;
            newPosition = "bottom";
          }
        } else if (finalPosition === "bottom") {
          ({ top, left, transform } = getPositionStyles("bottom"));

          if (top + tooltipHeight > windowHeight - padding) {
            needsPositionChange = true;
            newPosition = "top";
          }
        } else if (finalPosition === "left") {
          ({ top, left, transform } = getPositionStyles("left"));

          if (left < padding) {
            needsPositionChange = true;
            newPosition = "right";
          }
        } else if (finalPosition === "right") {
          ({ top, left, transform } = getPositionStyles("right"));

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
          ({ top, left, transform } = getPositionStyles(newPosition));
        }

        // 화면 경계 내로 조정 (transform 적용 전 위치)
        const useHorizontalCenter = transform.includes("translateX");
        const useVerticalCenter = transform.includes("translateY");

        if (useHorizontalCenter) {
          const halfWidth = tooltipWidth / 2;
          left = Math.max(padding + halfWidth, Math.min(left, windowWidth - padding - halfWidth));
        } else {
          left = Math.max(padding, Math.min(left, windowWidth - tooltipWidth - padding));
        }

        if (useVerticalCenter) {
          const halfHeight = tooltipHeight / 2;
          top = Math.max(padding + halfHeight, Math.min(top, windowHeight - padding - halfHeight));
        } else {
          top = Math.max(padding, Math.min(top, windowHeight - tooltipHeight - padding));
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
  }, [isVisible, finalPosition, disablePortal]);

  const inlinePositionClass =
    finalPosition === "top"
      ? align === "start"
        ? "absolute left-0 bottom-full mb-2"
        : "absolute left-1/2 -translate-x-1/2 bottom-full mb-2"
      : finalPosition === "bottom"
        ? align === "start"
          ? "absolute left-0 top-full mt-2"
          : "absolute left-1/2 -translate-x-1/2 top-full mt-2"
        : finalPosition === "left"
          ? align === "start"
            ? "absolute right-full mr-2 top-0"
            : "absolute right-full mr-2 top-1/2 -translate-y-1/2"
          : align === "start"
            ? "absolute left-full ml-2 top-0"
            : "absolute left-full ml-2 top-1/2 -translate-y-1/2";

  const tooltipBoxClass = `px-3 py-2.5 bg-neutral-90 dark:bg-neutral-10 text-white text-[13px] rounded-lg shadow-xl pointer-events-none ${
    multiline ? "whitespace-normal break-words" : "whitespace-nowrap"
  }`;

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        disablePortal ? (
          <div className={`z-[9999] ${inlinePositionClass}`}>
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, delay }}
              className={tooltipBoxClass}
              style={{
                maxWidth: multiline ? maxWidth : undefined,
                lineHeight: multiline ? "1.6" : undefined,
              }}
            >
              {content}
            </motion.div>
          </div>
        ) : (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, delay }}
            className={`z-[9999] ${tooltipBoxClass}`}
            style={{
              ...tooltipStyle,
              maxWidth: multiline ? maxWidth : undefined,
              lineHeight: multiline ? "1.6" : undefined,
            }}
          >
            {content}
          </motion.div>
        )
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
        {disablePortal ? tooltipContent : null}
      </div>
      {!disablePortal &&
        typeof window !== "undefined" &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}
