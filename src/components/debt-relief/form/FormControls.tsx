import { useState, type ReactNode } from "react";

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
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${INPUT_CLASS} ${className}`}
    />
  );
}

// 최대 9자리(999,999,999만원 = 약 10조원) — 이보다 길면 Number.MAX_SAFE_INTEGER를 넘어
// parseInt 결과가 부정확해지고 toLocaleString 표시가 깨진다. 개인 채무/자산 입력 범위로는
// 충분히 넉넉해 실사용에는 제약이 되지 않는다.
const MANWON_MAX_DIGITS = 9;

// 만원 단위 숫자 입력. 값은 콤마 포맷, 우측에 "만원" 접미사
export function ManwonInput({
  value,
  onChange,
  placeholder = "0",
  invalid = false,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  // true면 border를 danger 색으로 표시 (예: 제출 시점에 발견된 채무 금액 합계 초과).
  // 호출부에서 값이 다시 유효해지는 순간 false로 넘겨주면 즉시 해제된다.
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={value ? value.toLocaleString("ko-KR") : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, MANWON_MAX_DIGITS);
          onChange(digits ? parseInt(digits, 10) : 0);
        }}
        placeholder={placeholder}
        className={`${INPUT_CLASS} pr-12 ${invalid ? "!border-danger-40 dark:!border-danger-40" : ""}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 pointer-events-none">
        만원
      </span>
    </div>
  );
}

// 연체 개월 수 입력. 값이 null이면 "미입력"이고 0은 "연체 없음"이라는 유효한 입력이라,
// 빈 문자열은 null로 되돌려 두 상태를 구분한다 — 0을 falsy로 판정하면 연체 없는 고객이
// 필수값 검증에 걸려 제출이 막힌다.
const MONTHS_MAX_DIGITS = 3;

export function MonthsInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={value === null ? "" : String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, MONTHS_MAX_DIGITS);
          onChange(digits ? parseInt(digits, 10) : null);
        }}
        placeholder={placeholder}
        className={`${INPUT_CLASS} pr-12`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 pointer-events-none">
        개월
      </span>
    </div>
  );
}

/** 원 단위 금액 입력 — 상세 채무입력 전용(다른 금액 필드는 전부 만원 단위) */
const WON_MAX_DIGITS = 13;

export function WonInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      inputMode="numeric"
      value={value ? value.toLocaleString("ko-KR") : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, WON_MAX_DIGITS);
        onChange(digits ? parseInt(digits, 10) : 0);
      }}
      placeholder={placeholder}
      className={`${INPUT_CLASS} text-right ${className}`}
    />
  );
}

// 금리(%) 입력 — 소수점 허용(예: 6.5). 정수부 3자리 + 소수부 2자리까지.
// 컨트롤드 입력을 매 입력마다 숫자로 되돌리면 "6." 같은 중간 상태에서 소수점이 사라져
// 소수 입력이 아예 불가능해지므로, 편집 중에는 원본 텍스트를 그대로 보여주다가
// blur 시점에 value(prop)를 다시 따라가게 한다 — DatePicker의 allowTextInput과 동일한 패턴.
const PERCENT_MAX_INTEGER_DIGITS = 3;
const PERCENT_MAX_DECIMAL_DIGITS = 2;

export function PercentInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editingText, setEditingText] = useState<string | null>(null);
  const displayValue = editingText ?? (value ? String(value) : "");

  return (
    <div className="relative">
      <input
        inputMode="decimal"
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          const dotIndex = raw.indexOf(".");
          const cleaned =
            dotIndex === -1
              ? raw
              : raw.slice(0, dotIndex + 1) + raw.slice(dotIndex + 1).replace(/\./g, "");
          const [intPart, decPart] = cleaned.split(".");
          const boundedInt = intPart.slice(0, PERCENT_MAX_INTEGER_DIGITS);
          const next =
            decPart !== undefined
              ? `${boundedInt}.${decPart.slice(0, PERCENT_MAX_DECIMAL_DIGITS)}`
              : boundedInt;
          setEditingText(next);
          onChange(next ? parseFloat(next) || 0 : 0);
        }}
        onBlur={() => setEditingText(null)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} pr-7 text-right ${className}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 pointer-events-none">
        %
      </span>
    </div>
  );
}
