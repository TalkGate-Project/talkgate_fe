type KpiCardProps = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  loading?: boolean;
};


export default function KpiCard({ icon, label, value, className, loading }: KpiCardProps) {
  return (
    <div className={`surface rounded-[14px] elevation-1 pl-7 pt-7 pr-4 min-h-[120px] flex justify-between ${className ?? ""}`}>
      <div>
        <div className="text-title-4 font-semibold text-neutral-90">{label}</div>
        <div
          className="mt-2 font-montserrat font-bold text-[28px] leading-[34px] tracking-[1px] text-foreground"
        >
          {loading ? <span className="inline-flex h-8 w-24 animate-pulse rounded bg-neutral-20" /> : value}
        </div>
      </div>

      <div
        className="w-[60px] h-[60px] rounded-[12px] grid place-items-center"
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


