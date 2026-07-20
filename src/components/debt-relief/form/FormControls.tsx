import type { ReactNode } from "react";

/** 스텝 본문 섹션 제목 — 데스크톱만. 모바일은 상단 드로어 스텝명이 대신함 */
export function FormSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="hidden md:block text-[16px] font-semibold tracking-[0.2px] text-foreground pb-3 border-b border-neutral-30">
      {children}
    </h3>
  );
}

export function FormField({
  label,
  hint,
  children,
  className = "",
  required = false,
  filled = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  /** 필수 필드 — 라벨 오른쪽에 빨간 * */
  required?: boolean;
  /** valid 값이 입력된 필드 — 라벨 색상 #2563EB (다크모드는 Secondary-20) */
  filled?: boolean;
}) {
  return (
    <div className={className}>
      {/* Figma: label 14/500 lh-17 #808080, control까지 8px — lh 미지정 시 기본 ~21로 간격이 벌어 보임 */}
      <div className="flex items-center gap-2 mb-2">
        <label
          className={`text-[14px] font-medium leading-[17px] tracking-[0.2px] ${
            filled ? "text-secondary-60 dark:text-secondary-20" : "text-neutral-60"
          }`}
        >
          {label}
          {required ? (
            <span className="text-danger-40" aria-hidden>
              *
            </span>
          ) : null}
        </label>
        {hint && (
          <span className="text-[12px] leading-[17px] text-neutral-50">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// Figma textbox: h-34, px-12 py-8, radius 5, border #E2E2E2
const INPUT_CLASS =
  "w-full h-[34px] px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50";

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INPUT_CLASS}
    />
  );
}

// 만원 단위 숫자 입력. 값은 콤마 포맷, 우측에 "만원" 접미사
export function ManwonInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={value ? value.toLocaleString("ko-KR") : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onChange(digits ? parseInt(digits, 10) : 0);
        }}
        placeholder={placeholder}
        className={`${INPUT_CLASS} pr-12`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 pointer-events-none">
        만원
      </span>
    </div>
  );
}
