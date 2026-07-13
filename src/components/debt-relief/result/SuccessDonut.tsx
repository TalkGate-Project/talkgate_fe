import { useId } from "react";

export default function SuccessDonut({
  value,
  size = 136,
  stroke = 8,
  label = "성공 가능성",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;
  // 같은 페이지에 도넛이 여러 개여도 gradient id가 충돌하지 않도록
  const gradientId = `success-donut-grad-${useId().replace(/:/g, "")}`;

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
            stroke="#F2F3F7"
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

      <div className="absolute flex flex-col items-center">
        <p className="text-[13px] md:text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-neutral-60 mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-0.5">
          <span className="font-montserrat font-bold text-[24px] md:text-[28px] leading-[34px] tracking-[1px] text-neutral-90">
            {clamped}
          </span>
          <span className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-60">
            /100
          </span>
        </div>
      </div>
    </div>
  );
}
