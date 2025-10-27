interface NotificationIconProps {
  isActive?: boolean;
  className?: string;
}

export default function NotificationIcon({ isActive = false, className = "" }: NotificationIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M18 8A6 6 0 006 8c0 3.314-.75 5.25-1.5 6.5-.75 1.25-.75 1.5-.75 2h16.5s0-.75-.75-2C18.75 13.25 18 11.314 18 8z"
        stroke={isActive ? "#00E272" : "#808080"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke={isActive ? "#00E272" : "#808080"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

