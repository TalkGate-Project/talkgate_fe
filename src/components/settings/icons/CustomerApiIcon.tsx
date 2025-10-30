interface CustomerApiIconProps {
  isActive?: boolean;
  className?: string;
}

export default function CustomerApiIcon({ isActive = false, className = "" }: CustomerApiIconProps) {
  const stroke = isActive ? "#00C851" : "#808080";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="3.5" width="15" height="9" rx="2.5" stroke={stroke} strokeWidth="1.5" />
      <path d="M10 12.5V16.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 16.5H14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.5" cy="8" r="1" fill={stroke} />
      <path d="M9 8H14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

