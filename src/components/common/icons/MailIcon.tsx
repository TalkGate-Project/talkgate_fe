interface MailIconProps {
  className?: string;
}

export default function MailIcon({ className = "" }: MailIconProps) {
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
        d="M2.5 6.66663L9.0755 11.0503C9.63533 11.4235 10.3647 11.4235 10.9245 11.0503L17.5 6.66663M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1666V5.83329C17.5 4.91282 16.7538 4.16663 15.8333 4.16663H4.16667C3.24619 4.16663 2.5 4.91282 2.5 5.83329V14.1666C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


