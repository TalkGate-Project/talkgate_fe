"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type BaseModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  /** 기본 z-[100] 위에 다른 전역 모달(에러/공지 등)이 겹쳐야 할 때만 지정 — 대부분은 기본값 사용. */
  zIndexClassName?: string;
  overlayClassName?: string;
  containerClassName?: string;
  positionerClassName?: string;
  positionerStyle?: React.CSSProperties;
  disableAutoContainerSizing?: boolean;
  closeOnOverlayClick?: boolean;
  ariaLabel?: string;
  fullScreenOnMobile?: boolean;
  disableScrollLock?: boolean;
};

// Simple shared counter to handle nested modals scroll lock
const getCounter = () => {
  if (typeof window === "undefined") return { value: 0 } as any;
  // @ts-expect-error - Attaching modal counter to window object for global state
  window.__tgModalCounter = window.__tgModalCounter || { value: 0 };
  // @ts-expect-error - Accessing modal counter from window object
  return window.__tgModalCounter as { value: number };
};

function lockBodyScroll() {
  const counter = getCounter();
  counter.value += 1;
  if (counter.value === 1) {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
}

function unlockBodyScroll() {
  const counter = getCounter();
  counter.value = Math.max(0, counter.value - 1);
  if (counter.value === 0) {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }
}

export default function BaseModal({
  onClose,
  children,
  zIndexClassName = "z-[100]",
  overlayClassName = "",
  containerClassName = "",
  positionerClassName = "",
  positionerStyle,
  disableAutoContainerSizing = false,
  closeOnOverlayClick = true,
  ariaLabel = "dialog",
  fullScreenOnMobile = false,
  disableScrollLock = false,
}: BaseModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!disableScrollLock) {
      lockBodyScroll();
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // very small focus trap
        const root = containerRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (!disableScrollLock) {
        unlockBodyScroll();
      }
    };
  }, [onClose, disableScrollLock]);

  useEffect(() => {
    // focus first focusable
    const root = containerRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      root.focus();
    }
  }, []);

  const modal = (
    <div
      className={`fixed inset-0 ${zIndexClassName} ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        // 카드(containerRef) 바깥을 클릭했을 때만 닫는다. positioner(중앙 정렬용 flex 래퍼)가
        // 오버레이 전체를 덮고 있어서 e.target은 실제로는 거의 항상 positioner이지 오버레이
        // 자신(e.currentTarget)이 아니다 — 예전의 "e.target === e.currentTarget" 체크는 그래서
        // 배경 클릭 시 사실상 항상 거짓이었다(모든 BaseModal 사용처에 있던 기존 버그).
        //
        // DatePicker/MonthPicker/TimePicker 등 useAnchoredPanel 기반 팝오버는 위치 계산을 위해
        // document.body에 별도로 포털링된다 — DOM상으로는 containerRef의 자손이 아니라서 그
        // 안을 클릭해도 이 체크에 걸려 모달이 함께 닫혔다. [data-anchored-panel]로 표시된
        // 팝오버 내부 클릭은 containerRef 안 클릭과 동일하게 취급해 제외한다.
        const target = e.target as HTMLElement;
        if (
          closeOnOverlayClick &&
          !containerRef.current?.contains(target) &&
          !target.closest?.("[data-anchored-panel]")
        ) {
          onClose();
        }
      }}
    >
      <div
        className={
          positionerClassName ||
          `${
            fullScreenOnMobile
              ? "h-full p-0 lg:h-auto lg:min-h-full lg:flex lg:items-center lg:justify-center lg:p-4"
              : "min-h-full flex items-center justify-center p-4 lg:p-4"
          }`
        }
        style={positionerStyle}
      >
        <div
          ref={containerRef}
          tabIndex={-1}
          className={`${disableAutoContainerSizing ? "" : "w-full h-full md:w-auto md:h-auto md:max-h-[90vh]"} ${containerClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Portal to body
  if (typeof document !== "undefined") {
    return createPortal(modal, document.body);
  }
  return modal;
}


