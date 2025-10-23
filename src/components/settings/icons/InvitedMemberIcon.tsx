interface InvitedMemberIconProps {
  isActive?: boolean;
  className?: string;
}

export default function InvitedMemberIcon({ isActive = false, className = "" }: InvitedMemberIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
      <path
        d="M4 16C4 13.7909 5.79086 12 8 12H12C14.2091 12 16 13.7909 16 16V17H4V16Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
      <path
        d="M17 6H19V8H17V6Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
      <path
        d="M15 8H21V10H15V8Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
    </svg>
  );
}
