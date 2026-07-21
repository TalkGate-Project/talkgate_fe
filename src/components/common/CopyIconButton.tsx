"use client";

import { cn } from "@/utils/cn";

function CopyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="1" y="1" width="34" height="34" rx="5" fill="white" />
      <rect x="0.5" y="0.5" width="35" height="35" rx="5.5" stroke="#E2E2E2" />
      <path
        d="M14 22H12C10.8954 22 10 21.1046 10 20V12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V14M16 26H24C25.1046 26 26 25.1046 26 24V16C26 14.8954 25.1046 14 24 14H16C14.8954 14 14 14.8954 14 16V24C14 25.1046 14.8954 26 16 26Z"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopySuccessIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="1" y="1" width="34" height="34" rx="5" fill="white" />
      <rect x="0.5" y="0.5" width="35" height="35" rx="5.5" stroke="#E2E2E2" />
      <path
        d="M11 19L15 23L25 13"
        stroke="#00E272"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 박스/테두리 없는 24x24 스타일 — 다른 plain 아이콘(히스토리·연동·삭제)과 나란히 쓰이는 곳용 */
function CopyIconPlain() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopySuccessIconPlain() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M20 6L9 17L4 12"
        stroke="#00E272"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 사이트 전역 공용 복사 버튼 — 복사 성공 시 체크 아이콘으로 잠깐 바뀌었다가 원복 */
export default function CopyIconButton({
  copied,
  onClick,
  disabled,
  ariaLabel = "복사하기",
  className,
  variant = "boxed",
}: {
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  /** boxed: 흰 배경+테두리 36px(기본), plain: 배경 없는 24px */
  variant?: "boxed" | "plain";
}) {
  const IdleIcon = variant === "plain" ? CopyIconPlain : CopyIcon;
  const SuccessIcon = variant === "plain" ? CopySuccessIconPlain : CopySuccessIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "cursor-pointer shrink-0 grid place-items-center hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {copied ? (
        <span className="inline-flex animate-copy-success-pop">
          <SuccessIcon />
        </span>
      ) : (
        <IdleIcon />
      )}
    </button>
  );
}
