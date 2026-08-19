"use client";

function BookOpenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M10 5.21098V16.0443M10 16.0443C10.9732 15.3977 12.2946 15.0003 13.75 15.0003C15.2054 15.0003 16.5268 15.3977 17.5 16.0443V5.21098C16.5268 4.56438 15.2054 4.16699 13.75 4.16699C12.2946 4.16699 10.9732 4.56438 10 5.21098C9.02675 4.56438 7.70541 4.16699 6.25 4.16699C4.79459 4.16699 3.47325 4.56438 2.5 5.21098V16.0443C3.47325 15.3977 4.79459 15.0003 6.25 15.0003C7.70541 15.0003 9.02675 15.3977 10 16.0443Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProcedureGuideButtonProps {
  onClick: () => void;
}

export default function ProcedureGuideButton({ onClick }: ProcedureGuideButtonProps) {
  return (
    <button
      type="button"
      aria-label="제도안내"
      onClick={onClick}
      className="flex h-[34px] w-[102px] shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[5px] border border-neutral-30 px-3 text-foreground transition-colors hover:bg-neutral-10"
    >
      <BookOpenIcon />
      <span className="whitespace-nowrap text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground">
        제도안내
      </span>
    </button>
  );
}
