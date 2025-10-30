export default function GreetingBanner() {
  const gradient = "linear-gradient(90deg, var(--neutral-0) 65%, color-mix(in srgb, var(--primary-20) 35%, transparent))";

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
            안녕하세요, 김직원님 👋
          </h1>
          <p className="mt-3 typo-title-1 text-muted-foreground">2025. 09.19 오후 3:04:26</p>
          <p className="mt-3 typo-title-1 text-muted-foreground">&ldquo;투자에서 가장 중요한 것은 시간이다&rdquo;</p>
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


