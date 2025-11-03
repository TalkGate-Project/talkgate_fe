type GreetingBannerProps = {
  userName?: string | null;
  todayQuote?: string | null;
  now?: Date;
  loading?: boolean;
};

export default function GreetingBanner({ userName, todayQuote, now = new Date(), loading }: GreetingBannerProps) {
  const gradient = "linear-gradient(90deg, var(--neutral-0) 65%, color-mix(in srgb, var(--primary-20) 35%, transparent))";
  const displayName = userName ? `${userName}님` : "팀원님";
  const formattedNow = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(now).replace(".", ".");

  return (
    <section
      className="surface rounded-card p-6 md:p-8 elevation-2"
      style={{
        background: gradient,
      }}
    >
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="typo-h2 text-foreground tracking-[-0.02em]">
            {loading ? (
              <span className="inline-flex h-8 w-48 animate-pulse rounded bg-[var(--neutral-20)]" />
            ) : (
              <>안녕하세요, {displayName} 👋</>
            )}
          </h1>
          <p className="mt-3 typo-title-1 text-muted-foreground">
            {loading ? <span className="inline-flex h-6 w-40 animate-pulse rounded bg-[var(--neutral-20)]" /> : formattedNow}
          </p>
          <p className="mt-3 typo-title-1 text-muted-foreground">
            {loading ? (
              <span className="inline-flex h-6 w-80 animate-pulse rounded bg-[var(--neutral-20)]" />
            ) : todayQuote ? (
              <>“{todayQuote}”</>
            ) : (
              "오늘도 고객과의 만남을 준비해 보세요!"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 h-full">
          <button
            className="h-[34px] px-3 rounded-md border text-[14px] font-semibold tracking-[-0.02em] transition-colors"
            style={{
              borderColor: "var(--neutral-50)",
              color: "var(--danger-40)",
              background: "var(--neutral-0)",
            }}
          >
            ● 퇴근상태
          </button>
          <button
            className="h-[34px] px-3 rounded-md text-[14px] font-semibold tracking-[-0.02em] transition-colors"
            style={{
              background: "var(--neutral-90)",
              color: "var(--neutral-40)",
            }}
          >
            퇴근하기
          </button>
        </div>
      </div>
    </section>
  );
}


