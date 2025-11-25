import { useState } from "react";
import { AuthService } from "@/services/auth";

type ProfileStepProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function ProfileStep({ onComplete, onSkip }: ProfileStepProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    // 프로필 입력 단계 폼 영역 시작
    <form
      className="mt-8 w-full space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        AuthService.updateProfile({
          name: name || undefined,
          phone: phone || undefined,
        })
          .then(() => {
            onComplete();
          })
          .catch(() => {
            // 실패 시에도 일단 플로우를 진행 (대시보드로 이동)
            onComplete();
          });
      }}
    >
      {/* 안내 문구 영역 시작 */}
      <div className="text-[#BFBFBF] text-[14px] font-medium text-center mb-[30px]">
        회원가입을 진행해주세요.
      </div>
      {/* 안내 문구 영역 끝 */}

      {/* 이름 입력 영역 시작 */}
      <label className="block text-[#CECECE] text-[14px] font-medium mb-1">
        이름
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름을 입력하세요"
        className="w-full h-[34px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
      />
      {/* 이름 입력 영역 끝 */}

      {/* 핸드폰 번호 입력 영역 시작 */}
      <label className="block text-[#CECECE] text-[14px] font-medium mt-3 mb-1">
        핸드폰 번호
      </label>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="핸드폰 번호를 입력하세요"
          className="flex-1 h-[34px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
        />
      </div>
      {/* 핸드폰 번호 입력 영역 끝 */}

      {/* 하단 버튼 영역 (건너뛰기 / 시작하기) 시작 */}
      <div className="mt-[30px] flex gap-5">
        <button
          type="button"
          className="cursor-pointer w-full h-[40px] px-3 rounded-[5px] bg-[#2F2F2F] text-[#D0D0D0] text-[13px]"
          onClick={onSkip}
        >
          건너뛰기
        </button>
        <button
          type="submit"
          className="cursor-pointer w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold"
        >
          시작하기
        </button>
      </div>
      {/* 하단 버튼 영역 (건너뛰기 / 시작하기) 끝 */}
    </form>
    // 프로필 입력 단계 폼 영역 끝
  );
}


