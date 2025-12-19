"use client";

import LoadingSpinner from "@/components/common/LoadingSpinner";

export function DoneStep() {
  return (
    // 회원가입 완료 - 리다이렉트 중 로딩 표시
    <div className="mt-8 w-full flex flex-col items-center justify-center gap-4">
      {/* 로딩 스피너 - 프로젝트 그레이톤 색상 사용 */}
      <LoadingSpinner size="xl" variant="neutral" />
      <div className="text-[#BFBFBF] text-[14px] text-center">
        회원가입이 완료되었습니다.
        <br />
        <span className="text-[#808080] text-[13px]">잠시만 기다려주세요...</span>
      </div>
    </div>
    // 회원가입 완료 화면 영역 끝
  );
}


