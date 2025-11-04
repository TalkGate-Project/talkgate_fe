"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type BaseModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  overlayClassName?: string;
  containerClassName?: string;
  ariaLabel?: string;
};

// Simple shared counter to handle nested modals scroll lock
const getCounter = () => {
  if (typeof window === "undefined") return { value: 0 } as any;
  // @ts-ignore
  window.__tgModalCounter = window.__tgModalCounter || { value: 0 };
  // @ts-ignore
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

export default function BaseModal({ onClose, children, overlayClassName = "", containerClassName = "", ariaLabel = "dialog" }: BaseModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lockBodyScroll();
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
      unlockBodyScroll();
    };
  }, [onClose]);

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
      className={`fixed inset-0 z-[100] ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        // only close when clicking real overlay (not children)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div ref={containerRef} tabIndex={-1} className={containerClassName}>
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


