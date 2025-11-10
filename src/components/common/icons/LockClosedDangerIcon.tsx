interface LockClosedDangerIconProps {
  className?: string;
}

export default function LockClosedDangerIcon({ className = "" }: LockClosedDangerIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M10.0007 12.5V14.1667M5.00065 17.5H15.0007C15.9211 17.5 16.6673 16.7538 16.6673 15.8333V10.8333C16.6673 9.91286 15.9211 9.16667 15.0007 9.16667H5.00065C4.08018 9.16667 3.33398 9.91286 3.33398 10.8333V15.8333C3.33398 16.7538 4.08018 17.5 5.00065 17.5ZM13.334 9.16667V5.83333C13.334 3.99238 11.8416 2.5 10.0007 2.5C8.1597 2.5 6.66732 3.99238 6.66732 5.83333V9.16667H13.334Z"
        stroke="#D83232"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


