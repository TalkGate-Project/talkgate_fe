// 토글 스위치. on = primary-60(#00E272), off = neutral-40(#D0D0D0)
export default function FormToggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`cursor-pointer relative w-10 h-6 rounded-[20px] shrink-0 transition-colors flex items-center px-1 ${
        checked ? "bg-primary-60 justify-end" : "bg-neutral-40 justify-start"
      }`}
    >
      <div className="w-4 h-4 bg-white rounded-full" />
    </button>
  );
}

/** Figma: 카드 보더 없는 토글 행 — 모바일은 양끝 정렬, 데스크톱은 라벨↔스위치 gap 20(기본) 또는
 * wideGap 지정 시 150(새출발기금 결격·이력 확인처럼 여백을 넓게 둬야 하는 곳) */
export function FormToggleRow({
  label,
  checked,
  onChange,
  wideGap = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  wideGap?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-5 min-h-[34px] w-full lg:justify-start ${
        wideGap ? "lg:gap-[150px]" : ""
      }`}
    >
      <span className="min-w-0 text-[14px] font-medium leading-[17px] text-foreground">{label}</span>
      <FormToggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}
