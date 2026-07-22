import { useId } from "react";

export default function SuccessDonut({
  value,
  size = 136,
  stroke = 8,
  label = "성공 가능성",
  /** 회색 카드 위 등에서 중앙(성공 가능성·점수)을 흰 원으로 덮을 때 */
  whiteCover = false,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  whiteCover?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;
  // Figma cover: size 88 / stroke 5 → 78 (= size - stroke * 2)
  const coverSize = size - stroke * 2;
  // 같은 페이지에 도넛이 여러 개여도 gradient id가 충돌하지 않도록
  const gradientId = `success-donut-grad-${useId().replace(/:/g, "")}`;
  // 모바일 88 / 태블릿 120 / PC 136 — 크기에 맞춰 중앙 타이포 단계
  const density = size <= 88 ? "compact" : size < 136 ? "medium" : "full";

  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <defs>
          {/* Figma: linear-gradient(135deg, #A1FF8B → #3F93FF) — userSpaceOnUse로 화면 기준 고정 */}
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={size}
            y2={size}
          >
            <stop offset="0%" stopColor="#A1FF8B" />
            <stop offset="96.83%" stopColor="#3F93FF" />
          </linearGradient>
        </defs>

        {/* 12시 방향부터 진행되도록 원만 회전 (그라데이션은 고정) */}
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--neutral-30)"
            strokeWidth={stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </g>
      </svg>

      {whiteCover ? (
        <div
          className="absolute rounded-full bg-white dark:bg-neutral-10"
          style={{ width: coverSize, height: coverSize }}
          aria-hidden
        />
      ) : null}

      <div className="absolute flex flex-col items-center">
        <p
          className={`font-medium tracking-[-0.02em] text-neutral-60 ${
            density === "compact"
              ? "text-[10px] leading-3 mb-[7px]"
              : density === "medium"
                ? "text-[12px] leading-[14px] mb-1"
                : "text-[14px] leading-[17px] mb-1"
          }`}
        >
          {label}
        </p>
        <div className="flex items-baseline gap-0.5">
          <span
            className={`font-montserrat font-bold tracking-[1px] text-neutral-90 ${
              density === "compact"
                ? "text-[20px] leading-5"
                : density === "medium"
                  ? "text-[24px] leading-7"
                  : "text-[28px] leading-[34px]"
            }`}
          >
            {clamped}
          </span>
          <span
            className={`font-medium tracking-[-0.02em] text-neutral-60 ${
              density === "compact"
                ? "text-[10px] leading-3"
                : "text-[12px] leading-[14px]"
            }`}
          >
            /100
          </span>
        </div>
      </div>
    </div>
  );
}
