interface ConsultationChannelIconProps {
  isActive?: boolean;
  className?: string;
}

export default function ConsultationChannelIcon({ isActive = false, className = "" }: ConsultationChannelIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z"
        stroke={isActive ? "#00C851" : "#808080"}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M6 8H14M6 12H10"
        stroke={isActive ? "#00C851" : "#808080"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
