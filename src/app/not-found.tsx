export default function NotFound() {
  return (
    <main
      className="min-h-screen relative text-white"
      style={{
        backgroundImage: "url('/login_bg.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-[120px] leading-[1] font-bold tracking-tight">404</div>
          <div className="mt-3 text-[40px] leading-[49px] font-bold tracking-tight">NOT FOUND</div>
          <div className="mt-6 text-[24px] leading-[29px] font-medium">찾으시는 페이지를 발견할 수 없습니다.</div>
          <a
            href="/"
            className="mt-10 inline-flex items-center justify-center h-[34px] px-4 rounded-[5px] border border-white/70 text-[14px] font-semibold hover:bg-white/10"
          >
            처음으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}


