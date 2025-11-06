type Props = {
  active?: boolean;
};

export default function ListViewIcon({ active = false }: Props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.66675 9H18.3334M7.66675 13H18.3334M7.66675 17H18.3334"
        stroke={active ? "white" : "#B0B0B0"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

