interface ProfileIconProps {
  isActive?: boolean;
  className?: string;
}

export default function ProfileIcon({ isActive = false, className = "" }: ProfileIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
      <path
        d="M10 12C6.68629 12 4 14.6863 4 18H16C16 14.6863 13.3137 12 10 12Z"
        fill={isActive ? "#00C851" : "#808080"}
      />
    </svg>
  );
}
