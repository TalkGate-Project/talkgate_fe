interface ProfileIconProps {
  isActive?: boolean;
  className?: string;
}

export default function ProfileIcon({ isActive = false, className = "" }: ProfileIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        fill={isActive ? "#00E272" : "#808080"}
      />
      <path
        d="M12 14C8.58172 14 6 15.7909 6 18V22H18V18C18 15.7909 14.4183 14 12 14Z"
        fill={isActive ? "#00E272" : "#808080"}
      />
    </svg>
  );
}

