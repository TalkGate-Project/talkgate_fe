type Direction = "prev" | "next";

type Props = {
  direction: Direction;
  disabled?: boolean;
  onClick: () => void;
  "aria-label"?: string;
};

/**
 * 진단 폼 스텝 이전/다음 — pill(38×36) + chevron.
 * 비활성: fill #F8F8F8 · chevron #D0D0D0 / 활성: fill 없음(흰) · chevron #B0B0B0
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
      className={`inline-flex shrink-0 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"
      }`}
    >
      <svg width="38" height="36" viewBox="0 0 38 36" fill="none" aria-hidden>
        <rect
          x="0.5"
          y="0.5"
          width="37"
          height="35"
          rx="17.5"
          fill={disabled ? "#F8F8F8" : "white"}
          stroke="#E2E2E2"
          className={disabled ? "dark:fill-neutral-20" : "dark:fill-neutral-10"}
        />
        {direction === "prev" ? (
          <path
            d="M22 25L15 18L22 11"
            stroke={disabled ? "#D0D0D0" : "#B0B0B0"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={disabled ? "dark:stroke-neutral-50" : "dark:stroke-neutral-60"}
          />
        ) : (
          <path
            d="M16 25L23 18L16 11"
            stroke={disabled ? "#D0D0D0" : "#B0B0B0"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={disabled ? "dark:stroke-neutral-50" : "dark:stroke-neutral-60"}
          />
        )}
      </svg>
    </button>
  );
}
