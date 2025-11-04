interface CalendarNextIconProps {
  className?: string;
}

export default function CalendarNextIcon({ className = "" }: CalendarNextIconProps) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="0.5"
        y="-0.5"
        width="35"
        height="35"
        rx="5.5"
        transform="matrix(-1 0 0 1 36 1)"
        stroke="#E2E2E2"
      />
      <path
        d="M14.9999 24.8077L21.9999 17.8077L14.9999 10.8077"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

