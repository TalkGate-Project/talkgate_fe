"use client";

type Gender = "male" | "female";

type Props = {
  value: Gender | "";
  onChange: (value: Gender | "") => void;
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "남" },
  { value: "female", label: "여" },
];

// Figma Ticker3: h-34, px-20 py-4, radius 30
// 선택 = #000 흰 글자 / 미선택 = border #E2E2E2, 글자 opacity 0.8
export default function GenderToggle({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {GENDER_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(selected ? "" : option.value)}
            className={`cursor-pointer h-[34px] px-5 rounded-full text-[14px] font-medium leading-[17px] transition-colors ${
              selected
                ? "bg-neutral-100 text-neutral-0"
                : "border border-neutral-30 text-foreground/80 hover:border-neutral-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
