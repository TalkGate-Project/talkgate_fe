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
        // only close when clicking real overlay (not children)
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
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


