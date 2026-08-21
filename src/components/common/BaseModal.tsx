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

// 중첩된 BaseModal 각각이 독립적으로 window keydown을 구독하면 Escape/Tab 한 번에 스택 전체가
// 반응한다(모두 같은 window에 붙어있어 이벤트가 버블링을 거치지 않고 전부에게 전달됨) — 마운트
// 순서를 스택으로 추적해 최상단(가장 나중에 열린) 모달만 반응하도록 제한한다.
let modalIdSeq = 0;
const getModalStack = () => {
  if (typeof window === "undefined") return { ids: [] } as { ids: string[] };
  // @ts-expect-error - Attaching modal stack to window object for global state
  window.__tgModalStack = window.__tgModalStack || { ids: [] };
  // @ts-expect-error - Accessing modal stack from window object
  return window.__tgModalStack as { ids: string[] };
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
  const modalIdRef = useRef<string>("");
  if (!modalIdRef.current) {
    modalIdRef.current = `modal-${++modalIdSeq}`;
  }

  useEffect(() => {
    if (!disableScrollLock) {
      lockBodyScroll();
    }
    const stack = getModalStack();
    stack.ids.push(modalIdRef.current);

    const isTopmost = () => stack.ids[stack.ids.length - 1] === modalIdRef.current;

    const handleKey = (e: KeyboardEvent) => {
      if (!isTopmost()) return;
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
      const idx = stack.ids.lastIndexOf(modalIdRef.current);
      if (idx !== -1) stack.ids.splice(idx, 1);
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
        // 한 BaseModal이 다른 BaseModal의 children으로 중첩 렌더링되는 경우(예: 결제 정보
        // 모달 안에 환불/중단 확인 모달), 각 BaseModal은 createPortal로 document.body에
        // 따로 붙어 실제 DOM에서는 형제 관계지만, React 합성 이벤트는 실제 DOM이 아니라
        // React 트리를 따라 버블링된다. 그래서 안쪽 모달 안의 아무 클릭이나 바깥쪽 모달의
        // 이 핸들러까지 버블링되어 target이 바깥쪽 containerRef 밖(별도 포털)으로 판정되고
        // 바깥쪽 모달까지 함께 닫히는 버그가 있었다 — 여기서 전파를 막아 이 모달 선에서 끊는다.
        e.stopPropagation();

        // 카드(containerRef) 바깥을 클릭했을 때만 닫는다. positioner(중앙 정렬용 flex 래퍼)가
        // 오버레이 전체를 덮고 있어서 e.target은 실제로는 거의 항상 positioner이지 오버레이
        // 자신(e.currentTarget)이 아니다 — 예전의 "e.target === e.currentTarget" 체크는 그래서
        // 배경 클릭 시 사실상 항상 거짓이었다(모든 BaseModal 사용처에 있던 기존 버그).
        const target = e.target as HTMLElement;

        // 이 오버레이(e.currentTarget)의 실제 DOM 자손이 아닌 클릭은 애초에 "이 모달의 배경을
        // 클릭"한 게 아니다 — DatePicker 팝오버, CategoryDropdownPortal, 중첩된 다른 BaseModal
        // 등 document.body에 별도로 createPortal된 요소를 클릭한 것뿐인데, React 합성 이벤트가
        // 실제 DOM이 아니라 React 트리를 따라 여기까지 버블링된 것이다. 이 가드가 그런 클릭을
        // 구조적으로 걸러내므로, 새로 만드는 포털 컴포넌트가 아래 [data-anchored-panel] 마킹을
        // 깜빡해도 모달이 잘못 닫히지 않는다 — 마킹은 하위호환용 안전망으로 남겨둔다.
        const clickedWithinThisOverlay = e.currentTarget.contains(target);

        if (
          closeOnOverlayClick &&
          clickedWithinThisOverlay &&
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


