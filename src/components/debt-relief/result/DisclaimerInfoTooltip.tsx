"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

function InfoCircleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="block"
    >
      <path
        d="M12 16V12M12 8H12.01M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12Z"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function canHover(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

export default function DisclaimerInfoTooltip({
  children,
  iconSize = 24,
  label = "안내",
}: {
  children: ReactNode;
  iconSize?: number;
  label?: string;
}) {
  const tooltipId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex shrink-0 items-center self-center leading-none"
      onMouseEnter={() => {
        if (canHover()) setOpen(true);
      }}
      onMouseLeave={() => {
        if (canHover()) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex size-6 items-center justify-center rounded-full leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-40"
        onClick={() => {
          if (canHover()) return;
          setOpen((prev) => !prev);
        }}
      >
        <InfoCircleIcon size={iconSize} />
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={`pointer-events-none absolute left-1/2 top-[calc(100%+4px)] z-30 w-[min(325px,calc(100vw-40px))] -translate-x-[18px] transition-opacity duration-150 ${
          open ? "opacity-100" : "invisible opacity-0"
        }`}
        style={{
          filter: open ? "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" : undefined,
        }}
      >
        {/*
          배경 도형만 opacity 0.7로 묶어 합성 → 포인터/본체 겹쳐도 검은 선 없음.
          텍스트는 별도 레이어로 두어 흐려지지 않게 함.
        */}
        <span className="absolute inset-0 opacity-70" aria-hidden>
          <span
            className="absolute left-[8px] top-0 h-[13px] w-5 bg-black"
            style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
          />
          <span className="absolute inset-x-0 bottom-0 top-[12px] rounded-[8px] bg-black" />
        </span>

        <span className="relative block min-h-[62px] px-4 pb-3 pt-[25px] text-[13px] font-medium leading-[18px] tracking-[-0.02em] text-white">
          {children}
        </span>
      </span>
    </span>
  );
}
