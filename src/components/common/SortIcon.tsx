type SortIconProps = {
  state: 'none' | 'asc' | 'desc';
  className?: string;
};

export default function SortIcon({ state, className }: SortIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9.82322 14.8232L7.36569 12.3657C6.86171 11.8617 7.21865 11 7.93137 11L12.0686 11C12.7814 11 13.1383 11.8617 12.6343 12.3657L10.1768 14.8232C10.0791 14.9209 9.92085 14.9209 9.82322 14.8232Z"
        className={state === 'desc' ? 'fill-black dark:fill-neutral-80' : 'fill-[#B0B0B0]'}
      />
      <path
        d="M9.82322 5.17678L7.36569 7.63431C6.86171 8.13829 7.21865 9 7.93137 9L12.0686 9C12.7814 9 13.1383 8.13829 12.6343 7.63432L10.1768 5.17678C10.0791 5.07915 9.92085 5.07915 9.82322 5.17678Z"
        className={state === 'asc' ? 'fill-black dark:fill-neutral-80' : 'fill-[#B0B0B0]'}
      />
    </svg>
  );
}
