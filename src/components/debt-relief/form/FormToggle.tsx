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
