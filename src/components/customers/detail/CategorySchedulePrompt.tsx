"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CATEGORY_SCHEDULE_PRESETS = [
  { label: "30분 후", minutes: 30 },
  { label: "1시간 후", minutes: 60 },
  { label: "2시간 후", minutes: 120 },
  { label: "3시간 후", minutes: 180 },
] as const;

const DEFAULT_MINUTES = CATEGORY_SCHEDULE_PRESETS[0].minutes;
const PROMPT_WIDTH = 384;
const ESTIMATED_HEIGHT = 180;

function buildScheduleIsoFromNow(minutesToAdd: number): string {
  const target = new Date();
  target.setMinutes(target.getMinutes() + minutesToAdd);
  target.setSeconds(0, 0);
  return target.toISOString();
}

function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  const rawZoom = String(((document.body.style as any).zoom ?? "") as string).trim();
  const parsedZoom = Number.parseFloat(rawZoom);
  return Number.isFinite(parsedZoom) && parsedZoom > 0 ? parsedZoom : 1;
}

/** 앵커의 가장 가까운 스크롤 가능한 조상 요소를 찾는다. */
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

type AnchorPosition = {
  top: number;
  left: number;
  openAbove: boolean;
  visible: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onReserve: (scheduleTimeIso: string, description: string) => Promise<void>;
  customerName?: string;
  /** "anchor": 데스크톱 - 카테고리 input 아래에 표시 / "bottom": 모바일 - 화면 하단에 표시 */
  placement?: "anchor" | "bottom";
  anchorRef?: RefObject<HTMLElement | null>;
};

export default function CategorySchedulePrompt({
  open,
  onClose,
  onReserve,
  customerName,
  placement = "anchor",
  anchorRef,
}: Props) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(DEFAULT_MINUTES);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<AnchorPosition | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (submitting) return;
      const target = event.target as Node;
      if (promptRef.current && !promptRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, submitting]);

  useEffect(() => {
    if (!open) return;
    setSelectedMinutes(DEFAULT_MINUTES);
    setDescription("");
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open || placement !== "anchor" || !anchorRef?.current) {
      setPosition(null);
      return;
    }

    const scrollParent = getScrollParent(anchorRef.current);

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const zoom = getBodyZoom();
      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth / zoom;
      const viewportHeight = window.innerHeight / zoom;
      const anchorTop = rect.top / zoom;
      const anchorBottom = rect.bottom / zoom;
      const anchorLeft = rect.left / zoom;
      const verticalOffset = 8;
      const horizontalPadding = 16;

      // 앵커가 스크롤 컨테이너(모달 본문)의 보이는 영역을 벗어나면 프롬프트를 숨겨
      // 화면 밖으로 "탈출"하지 않도록 한다. 컨테이너가 없으면 뷰포트 기준으로 판단.
      const anchorCenter = rect.top + rect.height / 2;
      let visible = true;
      if (scrollParent) {
        const bounds = scrollParent.getBoundingClientRect();
        visible = anchorCenter >= bounds.top && anchorCenter <= bounds.bottom;
      } else {
        visible = rect.bottom >= 0 && rect.top <= window.innerHeight;
      }

      const spaceBelow = viewportHeight - anchorBottom - horizontalPadding;
      const openAbove = spaceBelow < ESTIMATED_HEIGHT && anchorTop - horizontalPadding > spaceBelow;
      const maxLeft = Math.max(horizontalPadding, viewportWidth - PROMPT_WIDTH - horizontalPadding);
      const left = Math.min(Math.max(horizontalPadding, anchorLeft), maxLeft);

      setPosition({
        top: openAbove ? anchorTop - verticalOffset : anchorBottom + verticalOffset,
        left,
        openAbove,
        visible,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, placement, anchorRef]);

  if (!open || typeof document === "undefined") return null;
  if (placement === "anchor" && !position) return null;

  const title = customerName
    ? `${customerName}님 일정을 추가 하시겠습니까?`
    : "일정을 추가 하시겠습니까?";

  const handleReserve = async () => {
    if (!description.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onReserve(buildScheduleIsoFromNow(selectedMinutes), description.trim());
      onClose();
    } catch (error) {
      console.error("Category schedule reservation failed:", error);
      // onReserve에서 에러 모달을 표시한 뒤 reject하므로 프롬프트는 유지
    } finally {
      setSubmitting(false);
    }
  };

  const card = (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="일정 추가"
      className="flex flex-col gap-3 bg-card dark:bg-neutral-10 px-4 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-bold leading-[17px] tracking-[-0.02em] text-black dark:text-neutral-90">
          {title}
        </p>
        <button
          type="button"
          aria-label="닫기"
          className="cursor-pointer w-6 h-6 shrink-0 grid place-items-center text-[#B0B0B0] hover:text-neutral-70 dark:hover:text-neutral-60 transition-colors"
          onClick={onClose}
          disabled={submitting}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto">
        {CATEGORY_SCHEDULE_PRESETS.map((preset) => {
          const isSelected = selectedMinutes === preset.minutes;
          return (
            <button
              key={preset.label}
              type="button"
              className={`cursor-pointer flex-shrink-0 h-[34px] px-3 rounded-[5px] text-[14px] leading-[17px] tracking-[-0.02em] whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-primary-10/40 border border-primary-60 font-semibold text-foreground"
                  : "bg-card border border-[#E2E2E2] font-medium text-black dark:bg-neutral-10 dark:border-neutral-30 dark:text-neutral-80"
              }`}
              onClick={() => setSelectedMinutes(preset.minutes)}
              disabled={submitting}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="일정내용을 입력하세요."
          className="flex-1 min-w-0 h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-neutral-30 bg-card dark:bg-neutral-10 px-3 text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-foreground dark:text-neutral-90 placeholder:text-[#808080] dark:placeholder:text-neutral-60"
          disabled={submitting}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleReserve();
            }
          }}
        />
        <button
          type="button"
          className={`shrink-0 h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[#EDEDED] dark:text-neutral-0 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] whitespace-nowrap ${
            !description.trim() || submitting
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:opacity-90"
          }`}
          onClick={() => void handleReserve()}
          disabled={!description.trim() || submitting}
        >
          일정예약
        </button>
      </div>
    </div>
  );

  if (placement === "bottom") {
    return createPortal(
      <div className="fixed inset-x-0 bottom-0 z-[210] pointer-events-none">
        <div
          ref={promptRef}
          className="pointer-events-auto rounded-t-[12px] bg-card dark:bg-neutral-10 shadow-[0px_-3px_12px_4px_rgba(9,30,66,0.1)] pb-[env(safe-area-inset-bottom)]"
        >
          {card}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      ref={promptRef}
      className="fixed z-[210] rounded-[5px] bg-card dark:bg-neutral-10 shadow-[-3px_5px_12px_4px_rgba(9,30,66,0.1)] overflow-hidden transition-opacity"
      style={{
        top: position!.top,
        left: position!.left,
        width: PROMPT_WIDTH,
        maxWidth: "calc(100vw - 32px)",
        transform: position!.openAbove ? "translateY(-100%)" : undefined,
        visibility: position!.visible ? "visible" : "hidden",
        opacity: position!.visible ? 1 : 0,
        pointerEvents: position!.visible ? "auto" : "none",
      }}
    >
      {card}
    </div>,
    document.body
  );
}
