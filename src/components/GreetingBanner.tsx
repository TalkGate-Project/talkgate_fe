export default function GreetingBanner() {
  return (
    <section
      className="surface rounded-card p-6 md:p-8 elevation-2"
      style={{
        background: "linear-gradient(90deg, #FFFFFF 65%, #E5FCF1 100%)",
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
          <button className="h-[34px] px-3 rounded-md border border-gray-400 text-[14px] font-semibold tracking-[-0.02em] text-red-500 bg-white">
            ● 퇴근상태
          </button>
          <button className="h-[34px] px-3 rounded-md bg-gray-900 text-[14px] font-semibold tracking-[-0.02em] text-gray-300">
            퇴근하기
          </button>
        </div>
      </div>
    </section>
  );
}


