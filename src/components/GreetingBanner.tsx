export default function GreetingBanner() {
  return (
    <section className="surface rounded-[32px] p-6 md:p-8" style={{
      background: "linear-gradient(90deg, #FFFFFF 65%, #E5FCF1 100%)",
      boxShadow: "6px 6px 54px rgba(0, 0, 0, 0.05)",
    }}>
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="font-sans font-bold tracking-[-0.02em] text-[32px] leading-[38px] text-[#252525]">
            안녕하세요, 김직원님 👋
          </h1>
          <p className="mt-3 text-[18px] leading-[21px] text-[#B0B0B0]">2025. 09.19 오후 3:04:26</p>
          <p className="mt-3 text-[18px] leading-[21px] text-[#B0B0B0]">&ldquo;투자에서 가장 중요한 것은 시간이다&rdquo;</p>
        </div>
        <div className="flex items-center gap-3 h-full">
          <button className="h-[34px] px-3 rounded-[5px] border border-[#808080] text-[14px] font-semibold tracking-[-0.02em] text-[#D83232]">
            ● 퇴근상태
          </button>
          <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[14px] font-semibold tracking-[-0.02em] text-[#D0D0D0]">
            퇴근하기
          </button>
        </div>
      </div>
    </section>
  );
}


