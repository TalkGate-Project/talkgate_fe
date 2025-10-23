interface BatchRegistrationIconProps {
  isActive?: boolean;
  className?: string;
}

export default function BatchRegistrationIcon({ isActive = false, className = "" }: BatchRegistrationIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M4 2C2.89543 2 2 2.89543 2 4V16C2 17.1046 2.89543 18 4 18H16C17.1046 18 18 17.1046 18 16V4C18 2.89543 17.1046 2 16 2H4Z"
        stroke={isActive ? "#00C851" : "#808080"}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M6 6H14M6 10H14M6 14H10"
        stroke={isActive ? "#00C851" : "#808080"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 6L17 8L15 10"
        stroke={isActive ? "#00C851" : "#808080"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
