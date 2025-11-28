import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { setTokens } from "@/lib/token";
import type { SignupTokens } from "@/types/signup";
import type { UpdateProfileInput } from "@/types/auth";

type ProfileStepProps = {
  tokens: SignupTokens;
  onComplete: () => void;
  onSkip: () => void;
};

export function ProfileStep({
  tokens,
  onComplete,
  onSkip,
}: ProfileStepProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 토큰을 쿠키에 저장하고 React Query 캐시를 무효화하는 공통 함수
  const saveTokensAndInvalidateCache = async () => {
    setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    // 이전 유저 정보 캐시를 제거하고 새 유저 정보로 갱신
    await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 로그인 없이 전달받은 토큰을 헤더에 직접 태워서 프로필 업데이트
      const profileData: UpdateProfileInput = {};
      if (name) profileData.name = name;
      if (phone) profileData.phone = phone;

      await apiClient.patch("/v1/auth/profile", profileData, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      
      // 프로필 업데이트 성공 후 토큰 저장 및 캐시 무효화
      await saveTokensAndInvalidateCache();
      onComplete();
    } catch {
      // 프로필 업데이트 실패 시에도 토큰 저장 및 캐시 무효화 후 완료 처리
      await saveTokensAndInvalidateCache();
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // 건너뛰기 시에는 프로필 업데이트 없이 토큰만 저장 및 캐시 무효화
      await saveTokensAndInvalidateCache();
      onSkip();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 프로필 입력 단계 폼 영역 시작
    <form
      className="mt-8 w-full space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
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
          className="cursor-pointer w-full h-[40px] px-3 rounded-[5px] bg-[#2F2F2F] text-[#D0D0D0] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          건너뛰기
        </button>
        <button
          type="submit"
          className="cursor-pointer w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          시작하기
        </button>
      </div>
      {/* 하단 버튼 영역 (건너뛰기 / 시작하기) 끝 */}
    </form>
    // 프로필 입력 단계 폼 영역 끝
  );
}


