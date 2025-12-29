interface CalendarPrevIconProps {
  className?: string;
}

export default function CalendarPrevIcon({ className = "" }: CalendarPrevIconProps) {
  return (
    <svg
      width="18"
      height="18"
      className={`md:w-9 md:h-9 ${className}`}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="17"
        height="17"
        rx="4.5"
        stroke="#E2E2E2"
        className="calendar-icon-border"
      />
      <path
        d="M10.5 12.5L7 9L10.5 5.5"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="calendar-icon-arrow"
      />
    </svg>
  );
}

