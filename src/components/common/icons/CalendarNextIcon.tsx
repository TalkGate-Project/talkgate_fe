interface CalendarNextIconProps {
  className?: string;
}

export default function CalendarNextIcon({ className = "" }: CalendarNextIconProps) {
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
        y="-0.5"
        width="17"
        height="17"
        rx="4.5"
        transform="matrix(-1 0 0 1 18 1)"
        stroke="#E2E2E2"
        className="calendar-icon-border"
      />
      <path
        d="M7.5 12.5L11 9L7.5 5.5"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="calendar-icon-arrow"
      />
    </svg>
  );
}

