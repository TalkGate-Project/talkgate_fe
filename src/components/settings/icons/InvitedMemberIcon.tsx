interface InvitedMemberIconProps {
  isActive?: boolean;
  className?: string;
}

export default function InvitedMemberIcon({ isActive = false, className = "" }: InvitedMemberIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12.4286 7.55556C12.4286 9.51923 10.8935 11.1111 9 11.1111C7.10645 11.1111 5.57143 9.51923 5.57143 7.55556C5.57143 5.59188 7.10645 4 9 4C10.8935 4 12.4286 5.59188 12.4286 7.55556Z" stroke={isActive ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 13.7778C5.68629 13.7778 3 16.5636 3 20H15C15 16.5636 12.3137 13.7778 9 13.7778Z" stroke={isActive ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 8V15M22 11.5L15 11.5" stroke={isActive ? "#00E272" : "#B0B0B0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
