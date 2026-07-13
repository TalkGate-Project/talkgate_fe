// 토글 스위치 (ProjectFeaturesSection 스타일 재사용). on = primary-60
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
      className={`cursor-pointer relative w-10 h-6 rounded-full shrink-0 transition-colors flex items-center px-1 ${
        checked ? "bg-primary-60 justify-end" : "bg-neutral-30 justify-start"
      }`}
    >
      <div className="w-4 h-4 bg-neutral-0 dark:bg-white rounded-full" />
    </button>
  );
}
