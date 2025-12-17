"use client";

type DoneStepProps = {
  onGoLogin: () => void;
};

export function DoneStep({ onGoLogin }: DoneStepProps) {
  return (
    // 회원가입 완료 화면 영역 시작
    <div className="mt-8 w-full text-center text-white">
      회원가입이 완료되었습니다.
      <div className="mt-4">
        <button
          className="px-4 h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold"
          onClick={onGoLogin}
        >
          로그인 하러가기
        </button>
      </div>
    </div>
    // 회원가입 완료 화면 영역 끝
  );
}


