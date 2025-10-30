type KpiCardProps = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
};

export default function KpiCard({ icon, label, value, className }: KpiCardProps) {
  return (
    <div className={`surface rounded-[14px] elevation-1 px-6 py-5 h-[120px] flex items-center justify-between ${className ?? ""}`}>
      <div>
        <div className="typo-caption-2 font-semibold" style={{ color: "var(--neutral-70)" }}>{label}</div>
        <div
          className="mt-2 font-[var(--font-montserrat)] font-bold text-[28px] leading-[34px] tracking-[1px]"
          style={{ color: "var(--foreground)" }}
        >
          {value}
        </div>
      </div>

      <div
        className="w-[72px] h-[72px] rounded-[12px] grid place-items-center"
        style={{ background: "color-mix(in srgb, var(--primary-60) 15%, transparent)" }}
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


