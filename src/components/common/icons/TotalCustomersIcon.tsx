interface TotalCustomersIconProps {
  className?: string;
}

export default function TotalCustomersIcon({ 
  className = ""
}: TotalCustomersIconProps) {
  return (
    <svg
      width="30"
      height="34"
      viewBox="0 0 30 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 11.3162L12.9004 18.7643C13.0394 18.8445 13.185 18.9024 13.3333 18.9392V33.3844L0.920061 26.0382C0.349782 25.7007 0 25.0873 0 24.4246V11.3162ZM29.9999 11.1182V24.4246C29.9999 25.0873 29.6501 25.7007 29.0798 26.0382L16.6666 33.3844V18.8126C16.6969 18.7975 16.7268 18.7814 16.7565 18.7643L29.9999 11.1182Z"
        fill="var(--primary-60)"
      />
      <path
        opacity="0.499209"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.405273 7.70142C0.562848 7.50244 0.761735 7.33426 0.993613 7.21076L14.1186 0.2201C14.6695 -0.0733665 15.3304 -0.0733665 15.8814 0.2201L29.0064 7.21076C29.1851 7.30596 29.3443 7.42771 29.48 7.56966L15.0899 15.8778C14.9953 15.9325 14.908 15.995 14.8285 16.064C14.749 15.995 14.6618 15.9325 14.5672 15.8778L0.405273 7.70142Z"
        fill="var(--primary-60)"
      />
    </svg>
  );
}

