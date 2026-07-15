import type { PillOption } from "@/types/debtRelief";

// Figma Ticker3
// 모바일: h-31, px-12 py-7, gap 8 / 데스크톱: h-34, px-20 py-4, radius 30
// 선택 = #000 흰 글자 / 미선택 = border #E2E2E2, 글자 opacity 0.8
function PillButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer inline-flex items-center justify-center box-border h-[31px] md:h-[34px] px-3 md:px-5 py-0 rounded-full text-[14px] font-medium leading-none transition-colors ${
        selected
          ? "border border-transparent bg-neutral-100 text-neutral-0"
          : "border border-neutral-30 text-foreground/80 tracking-[-0.04em] md:tracking-normal hover:border-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}

export function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <PillButton
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

export function PillMultiSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  const toggle = (target: T) => {
    onChange(value.includes(target) ? value.filter((item) => item !== target) : [...value, target]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <PillButton
          key={option.value}
          label={option.label}
          selected={value.includes(option.value)}
          onClick={() => toggle(option.value)}
        />
      ))}
    </div>
  );
}
