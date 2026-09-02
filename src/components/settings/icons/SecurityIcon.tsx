interface SecurityIconProps {
  isActive: boolean;
}

export default function SecurityIcon({ isActive }: SecurityIconProps) {
  const stroke = isActive ? "#00E272" : "#B0B0B0";

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
