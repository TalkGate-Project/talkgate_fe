"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  zoom: number;
  isFullscreen: boolean;
  onZoomChange: (zoom: number) => void;
  onFullscreenToggle: () => void;
};

const CONTROL_CLASS_NAME =
  "flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[5px] border border-[#E2E2E2] bg-black text-white transition-colors hover:bg-neutral-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40 disabled:cursor-not-allowed disabled:opacity-50";

export default function TeamCanvasControls({
  zoom,
  isFullscreen,
  onZoomChange,
  onFullscreenToggle,
}: Props) {
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);
  const mobileControlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobilePopoverOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (mobileControlsRef.current?.contains(event.target as Node)) return;
      setIsMobilePopoverOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobilePopoverOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobilePopoverOpen]);

  const handleZoomIn = () => {
    onZoomChange(Number(Math.min(2, zoom + 0.1).toFixed(2)));
  };

  const handleZoomOut = () => {
    onZoomChange(Number(Math.max(0.6, zoom - 0.1).toFixed(2)));
  };

  const handleFullscreenToggle = () => {
    setIsMobilePopoverOpen(false);
    onFullscreenToggle();
  };

  const controlButtons = (
    <>
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={zoom >= 2}
        className={CONTROL_CLASS_NAME}
        aria-label="조직도 확대"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleZoomOut}
        disabled={zoom <= 0.6}
        className={CONTROL_CLASS_NAME}
        aria-label="조직도 축소"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleFullscreenToggle}
        aria-pressed={isFullscreen}
        className={CONTROL_CLASS_NAME}
        aria-label={isFullscreen ? "전체화면 종료" : "전체화면으로 보기"}
      >
        {isFullscreen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 15H15V19M15 15L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 9H15V5M15 9L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 9H9V5M9 9L4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15H9V19M9 15L4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 4H4V8M4 4L9 9M16 4H20V8M20 4L15 9M8 20H4V16M4 20L9 15M20 20L15 15M16 20H20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </>
  );

  return (
    <>
      <div className="absolute right-4 top-4 z-20 hidden items-center gap-2 md:flex">
        {controlButtons}
      </div>

      <div ref={mobileControlsRef} className="absolute right-0 top-4 z-30 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobilePopoverOpen((isOpen) => !isOpen)}
          aria-expanded={isMobilePopoverOpen}
          aria-haspopup="menu"
          aria-label={isMobilePopoverOpen ? "조직도 도구 닫기" : "조직도 도구 열기"}
          className={CONTROL_CLASS_NAME}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 7H19M5 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="7" r="2" fill="black" stroke="currentColor" strokeWidth="2" />
            <circle cx="15" cy="17" r="2" fill="black" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        {isMobilePopoverOpen && (
          <div
            role="group"
            aria-label="조직도 화면 도구"
            className="absolute right-0 top-[42px] flex flex-col gap-2 rounded-[7px] border border-border bg-card p-2 shadow-[0_4px_14px_rgba(0,0,0,0.16)]"
          >
            {controlButtons}
          </div>
        )}
      </div>
    </>
  );
}
