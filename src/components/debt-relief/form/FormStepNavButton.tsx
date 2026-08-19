type Direction = "prev" | "next";

type Props = {
  direction: Direction;
  disabled?: boolean;
  onClick: () => void;
  "aria-label"?: string;
};

/** Figma 기준 진단 폼 스텝 이동 버튼 — 68×34, chevron 20px + 이전/다음 텍스트. */
export default function FormStepNavButton({
  direction,
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
}: Props) {
  const label = ariaLabel ?? (direction === "prev" ? "이전" : "다음");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex h-[34px] w-[68px] shrink-0 items-center justify-center gap-1 rounded-[5px] border p-1.5 transition-colors ${
        disabled
          ? "cursor-not-allowed border-neutral-30 bg-neutral-10"
          : "cursor-pointer border-neutral-30 bg-card hover:bg-neutral-10"
      }`}
    >
      {direction === "prev" && <ChevronIcon direction={direction} disabled={disabled} />}
      <span
        className={`text-[14px] font-medium leading-[17px] ${
          disabled ? "text-neutral-50 opacity-80" : "text-foreground/80"
        }`}
      >
        {label}
      </span>
      {direction === "next" && <ChevronIcon direction={direction} disabled={disabled} />}
    </button>
  );
}

function ChevronIcon({ direction, disabled }: { direction: Direction; disabled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`shrink-0 ${disabled ? "text-neutral-50" : "text-neutral-80"}`}
    >
      <path
        d={direction === "prev" ? "M12.5 4.5L7 10L12.5 15.5" : "M7.5 4.5L13 10L7.5 15.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
