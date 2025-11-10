interface TrashIconProps {
  className?: string;
}

export default function TrashIcon({ className = "" }: TrashIconProps) {
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
        d="M15.834 5.83333L15.1112 15.9521C15.0489 16.8243 14.3232 17.5 13.4488 17.5H6.55252C5.67812 17.5 4.95238 16.8243 4.89009 15.9521L4.16732 5.83333M8.33398 9.16667V14.1667M11.6673 9.16667V14.1667M12.5007 5.83333V3.33333C12.5007 2.8731 12.1276 2.5 11.6673 2.5H8.33398C7.87375 2.5 7.50065 2.8731 7.50065 3.33333V5.83333M3.33398 5.83333H16.6673"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


