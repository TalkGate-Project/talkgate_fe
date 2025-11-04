interface MemberIconProps {
  isActive?: boolean;
  className?: string;
}

export default function MemberIcon({ isActive = false, className = "" }: MemberIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M8 9C9.65685 9 11 7.65685 11 6C11 4.34315 9.65685 3 8 3C6.34315 3 5 4.34315 5 6C5 7.65685 6.34315 9 8 9Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
      <path
        d="M12 9C13.6569 9 15 7.65685 15 6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6C9 7.65685 10.3431 9 12 9Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
      <path
        d="M4 16C4 13.7909 5.79086 12 8 12H12C14.2091 12 16 13.7909 16 16V17H4V16Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
    </svg>
  );
}
