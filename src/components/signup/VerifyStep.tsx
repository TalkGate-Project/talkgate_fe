import { useEffect, useState } from "react";
import { SignupService } from "@/services/signup";
import { AuthService } from "@/services/auth";
import type { SignupTokens } from "@/types/signup";

type VerifyStepProps = {
  email: string;
  onSuccess: (tokens: SignupTokens) => void;
};

export function VerifyStep({ email, onSuccess }: VerifyStepProps) {
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  return (
    // 이메일 인증 단계 폼 영역 시작
    <form
      className="mt-8 w-full"
      onSubmit={async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setInvalid(false);
        setIsSubmitting(true);
        try {
          // 이메일 인증 코드 검증 - 성공 시 토큰 반환
          const res = await SignupService.verifyEmailCode({
            email,
            otp: code,
          });
          // 인증 성공 시 토큰과 함께 다음 단계로 이동
          // 토큰은 쿠키에 저장하지 않고 state로 관리
          onSuccess(res.tokens);
        } catch {
          setInvalid(true);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {/* 안내 문구 영역 시작 */}
      <div className="text-[#B9B9B9] text-[14px] font-medium mb-[30px] text-center">
        이메일로 전송된 6자리 인증코드를 입력하세요.
      </div>
      {/* 안내 문구 영역 끝 */}

      {/* 인증번호 입력 + 재전송 영역 시작 */}
      <div className="mb-[30px]">
        <label
          className={`block text-[12px] mb-2 ${
            invalid ? "text-[#FF5A5A]" : "text-[#B9B9B9]"
          }`}
        >
          인증번호
        </label>
        <div className="flex gap-[10px]">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setInvalid(false);
            }}
            placeholder="123456"
            className={`flex-1 h-[34px] rounded-[5px] border bg-transparent px-3 text-white ${
              invalid ? "border-[#FF5A5A]" : "border-[#444444]"
            } placeholder-[#555555]`}
          />
          <button
            type="button"
            className={`w-[72px] h-[34px] rounded-[5px] flex items-center justify-center ${
              resendCooldown > 0
                ? "bg-[#2F2F2F] text-[#808080] cursor-not-allowed"
                : "cursor-pointer bg-[#252525] text-[#D0D0D0]"
            } text-[13px] font-semibold`}
            onClick={() => {
              if (resendCooldown > 0) return;
              AuthService.resendEmailVerification({ email }).then(() => {
                setResendCooldown(60);
              });
            }}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `${resendCooldown}s` : "재전송"}
          </button>
        </div>
        {invalid && (
          <div className="mt-2 text-[#FF5A5A] text-[12px]">
            인증번호가 잘못되었습니다. 다시 인증하세요.
          </div>
        )}
      </div>
      {/* 인증번호 입력 + 재전송 영역 끝 */}

      {/* 다음 버튼 영역 시작 */}
      <button
        type="submit"
        className="w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? "확인 중..." : "다음"}
      </button>
      {/* 다음 버튼 영역 끝 */}
    </form>
    // 이메일 인증 단계 폼 영역 끝
  );
}


