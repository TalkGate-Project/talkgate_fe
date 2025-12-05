type KpiCardProps = {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
  loading?: boolean;
};

const montserratStyle = {
  fontFamily:
    'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui',
};

/**
 * 숫자를 천 단위 구분 기호(콤마)가 있는 문자열로 포맷팅
 * 숫자가 아닌 경우 원본 그대로 반환
 */
function formatNumberValue(value: React.ReactNode): React.ReactNode {
  // null, undefined 체크
  if (value == null) return value;

  // 숫자 타입인 경우
  if (typeof value === "number") {
    return value.toLocaleString("ko-KR");
  }

  // 문자열이면서 숫자로 변환 가능한 경우
  if (typeof value === "string") {
    const trimmed = value.trim();
    // 빈 문자열이면 그대로 반환
    if (trimmed === "") return value;
    
    // 숫자로 변환 시도
    const num = Number(trimmed);
    // 유효한 숫자인지 확인 (NaN이 아니고, Infinity가 아닌 경우)
    if (!isNaN(num) && isFinite(num)) {
      return num.toLocaleString("ko-KR");
    }
  }

  // 그 외의 경우 (React Element, boolean 등) 원본 그대로 반환
  return value;
}

export default function KpiCard({ icon, label, value, className, loading }: KpiCardProps) {
  const formattedValue = formatNumberValue(value);

  return (
    <div 
      className={`surface rounded-[14px] pl-7 pt-7 pr-4 min-h-[120px] flex justify-between ${className ?? ""}`}
      style={{ boxShadow: "6px 6px 54px 0px rgba(0, 0, 0, 0.05)" }}
    >
      <div>
        <div className="text-title-4 font-semibold text-neutral-90">{label}</div>
        <div
          className="mt-2 font-montserrat font-bold text-[28px] leading-[34px] tracking-[1px] text-foreground"
          style={montserratStyle}
        >
          {loading ? <span className="inline-flex h-8 w-24 animate-pulse rounded bg-neutral-20" /> : formattedValue}
        </div>
      </div>

      <div
        className="w-[60px] h-[60px] rounded-[12px] grid place-items-center"
        style={{ background: "color-mix(in srgb, var(--primary-60) 10%, transparent)" }}
      >
        {icon ?? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-60)" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        )}
      </div>
    </div>
  );
}


