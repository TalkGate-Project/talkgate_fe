interface CalendarPrevIconProps {
  className?: string;
}

// viewBox를 14로 재작성: 데스크톱 렌더 35px × zoom 0.8 = 28 screen px,
// 14 unit → 28 screen px = 2.0 per unit. 모든 좌표/stroke가 정수 screen px로 매핑되어
// Firefox의 zoom + SVG 서브픽셀 스냅 이슈를 회피한다.
export default function CalendarPrevIcon({ className = "" }: CalendarPrevIconProps) {
  return (
    <svg
      width="18"
      height="18"
      className={`md:w-[35px] md:h-[35px] ${className}`}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="3"
        stroke="#E2E2E2"
        className="calendar-icon-border"
      />
      <path
        d="M8 10L5 7L8 4"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="calendar-icon-arrow"
      />
    </svg>
  );
}
