type Direction = "prev" | "next";

type Props = {
  direction: Direction;
  disabled?: boolean;
  onClick: () => void;
  "aria-label"?: string;
};

/**
 * 진단 폼 스텝 이전/다음 — pill(38×36) + chevron.
 * 비활성: bg-neutral-10 · chevron muted / 활성: bg-card · chevron neutral-50
 * border는 SVG stroke가 아니라 CSS로 그려 overflow에 잘리지 않게 하고, 다크모드는 토큰을 따른다.
 */
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
      className={`inline-flex h-9 w-[38px] shrink-0 items-center justify-center rounded-full border border-neutral-20 transition-opacity dark:!border-neutral-40 ${
        disabled
          ? "cursor-not-allowed bg-neutral-10 text-neutral-40 dark:text-neutral-50"
          : "cursor-pointer bg-card text-neutral-50 hover:opacity-80 dark:text-neutral-60"
      }`}
    >
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden className="overflow-visible">
        {direction === "prev" ? (
          <path
            d="M9.5 14.5L2.5 8L9.5 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M4.5 14.5L11.5 8L4.5 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
