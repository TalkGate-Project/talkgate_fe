"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// 툴팁 박스와 화면 가장자리 사이 최소 여백
const VIEWPORT_EDGE_MARGIN = 12;
// 기본 위치(앵커 대비) — 화면 안에 들어오면 이 값 그대로 사용
const BASE_OFFSET_PX = 18;

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
  maxWidthPx = 325,
  fitContent = false,
}: {
  children: ReactNode;
  iconSize?: number;
  label?: string;
  /** 말풍선 최대 너비(px). 뷰포트가 좁으면 calc(100vw-40px)로 자동 축소된다. */
  maxWidthPx?: number;
  /** true면 maxWidthPx는 상한선으로만 쓰고, 실제 너비는 내용(줄바꿈 포함)에 맞춰 줄어든다.
   * children에 <br/>로 줄바꿈을 직접 지정한 경우 사용 — 폰트 로딩/폭 변화에 관계없이 항상
   * 지정한 줄 수로 렌더된다. false(기본)면 항상 maxWidthPx로 고정해 자연스러운 문단 줄바꿈을 유도한다. */
  fitContent?: boolean;
}) {
  const tooltipId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  // 기본 위치에서 화면 밖으로 나가는 만큼 보정하는 값(px). 0이면 기본 위치 그대로.
  const [edgeShiftPx, setEdgeShiftPx] = useState(0);

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

  // 열릴 때(+리사이즈/회전 시) 툴팁이 뷰포트를 벗어나는지 측정해 좌우로 밀어 넣는다.
  useLayoutEffect(() => {
    if (!open) {
      setEdgeShiftPx(0);
      return;
    }

    const measureAndClamp = () => {
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;
      const rect = tooltipEl.getBoundingClientRect();
      if (rect.right > window.innerWidth - VIEWPORT_EDGE_MARGIN) {
        setEdgeShiftPx(window.innerWidth - VIEWPORT_EDGE_MARGIN - rect.right);
      } else if (rect.left < VIEWPORT_EDGE_MARGIN) {
        setEdgeShiftPx(VIEWPORT_EDGE_MARGIN - rect.left);
      } else {
        setEdgeShiftPx(0);
      }
    };

    measureAndClamp();
    window.addEventListener("resize", measureAndClamp);
    return () => window.removeEventListener("resize", measureAndClamp);
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
        className="inline-flex items-center justify-center rounded-full leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-40"
        style={{ width: iconSize, height: iconSize }}
        onClick={() => {
          if (canHover()) return;
          setOpen((prev) => !prev);
        }}
      >
        <InfoCircleIcon size={iconSize} />
      </button>

      <span
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={`pointer-events-none absolute left-1/2 top-[calc(100%+4px)] z-30 transition-opacity duration-150 ${
          open ? "opacity-100" : "invisible opacity-0"
        }`}
        style={{
          width: fitContent ? "fit-content" : `min(${maxWidthPx}px, calc(100vw - 40px))`,
          maxWidth: `min(${maxWidthPx}px, calc(100vw - 40px))`,
          transform: `translateX(calc(-${BASE_OFFSET_PX}px + ${edgeShiftPx}px))`,
          filter: open ? "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" : undefined,
        }}
      >
        {/*
          배경 도형만 opacity 0.7로 묶어 합성 → 포인터/본체 겹쳐도 검은 선 없음.
          텍스트는 별도 레이어로 두어 흐려지지 않게 함.
          화살표는 박스가 화면 밖으로 안 밀리도록 이동한 만큼(edgeShiftPx) 반대로 보정해
          아이콘을 계속 가리키도록 유지한다.
        */}
        <span className="absolute inset-0 opacity-70" aria-hidden>
          <span
            className="absolute top-0 h-[13px] w-5 bg-black"
            style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)", left: `${8 - edgeShiftPx}px` }}
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
