"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/auth";
import { setSelectedProjectId } from "@/lib/project";
import { setAuthSessionActive } from "@/lib/authSession";
import { getRememberMePreference } from "@/lib/token";
import {
  getAllowedPostAuthRedirect,
  getPostAuthDestination,
} from "@/lib/postAuthRedirect";
import AuthLayout from "@/components/auth/AuthLayout";
import AsyncButton from "@/components/common/AsyncButton";

function TwoFactorLoginContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [totpCode, setTotpCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const twoFactorToken = searchParams.get("token");
  const redirectUrl = getAllowedPostAuthRedirect(
    searchParams.get("redirectUrl") || searchParams.get("returnUrl")
  );
  const rememberMe = searchParams.get("rememberMe") === "1" || (
    searchParams.get("rememberMe") == null && getRememberMePreference()
  );

  // Security: Redirect if no token provided
  useEffect(() => {
    if (!twoFactorToken) {
      router.replace("/login");
    }
  }, [twoFactorToken, router]);

  if (!twoFactorToken) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setInvalid(false);
    setErrorMessage("");

    if (!totpCode || totpCode.length !== 6) {
      setInvalid(true);
      setErrorMessage("6자리 OTP 코드를 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AuthService.twoFactorLogin({
        twoFactorToken,
        totpCode,
        rememberMe,
      });
      
      const data = (res as any)?.data;
      
      // 사용자 정보 캐시 무효화 (새로운 사용자 정보를 가져오기 위해)
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      
      // 서버에서 프로젝트 ID를 반환했으면 저장
      if (data?.projectId != null) {
        setSelectedProjectId(data.projectId);
      }
      
      setAuthSessionActive();
      // 2FA 인증 성공 후 리디렉션
      window.location.replace(getPostAuthDestination(redirectUrl));
    } catch (err: any) {
      const status = err?.status;
      const code = err?.data?.code;
      
      if (status === 400 && code === "TWO_FACTOR_NOT_ENABLED") {
        setErrorMessage("2단계 인증이 활성화되지 않았습니다");
        setInvalid(true);
      } else if (status === 401 && code === "INVALID_TWO_FACTOR_TOKEN") {
        setErrorMessage("인증 시간이 만료되었습니다. 다시 로그인해주세요");
        setInvalid(true);
        setTimeout(() => router.replace("/login"), 2000);
      } else if (status === 401 && code === "INVALID_TWO_FACTOR_CODE") {
        setErrorMessage("OTP 코드가 올바르지 않습니다");
        setInvalid(true);
      } else {
        setErrorMessage("인증에 실패했습니다. 다시 시도해주세요");
        setInvalid(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout ariaLabel="two-factor-login-form-area">
      <h1 className="sr-only">2단계 인증</h1>
      
      {/* Description */}
      <p className="mt-6 text-center text-[14px] text-[#CECECE] leading-relaxed">
        인증앱의 OTP를 확인해주세요.
      </p>

      <form
        className="w-full space-y-3"
        onSubmit={handleSubmit}
      >
        <label className={`block text-[12px] mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>
          OTP 번호
        </label>
        <input
          name="totpCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={totpCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setTotpCode(value);
            if (invalid) {
              setInvalid(false);
              setErrorMessage("");
            }
          }}
          placeholder={invalid ? "코드를 다시 입력하세요" : "6자리 코드를 입력하세요"}
          className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 text-white text-center text-[18px] tracking-widest ${
            invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"
          }`}
          autoComplete="one-time-code"
          autoFocus
        />
        
        {errorMessage && (
          <p className="text-[12px] text-[#FF5A5A] text-center mt-2">
            {errorMessage}
          </p>
        )}

        <AsyncButton
          type="submit"
          variant="auth"
          size="md"
          fullWidth
          loading={isSubmitting}
          loadingText="확인 중..."
          disabled={totpCode.length !== 6}
          className="mt-4"
        >
          확인
        </AsyncButton>
      </form>

      {/* Back to login link */}
      <div className="mt-6 text-[13px] text-[#BFBFBF]">
        <button
          type="button"
          className="cursor-pointer underline underline-offset-2 hover:text-[#3690EB] transition-colors"
          onClick={() => {
            const loginUrl = redirectUrl 
              ? `/login?redirectUrl=${encodeURIComponent(redirectUrl)}`
              : "/login";
            router.push(loginUrl);
          }}
        >
          로그인 화면으로 돌아가기
        </button>
      </div>
    </AuthLayout>
  );
}

export default function TwoFactorLoginContent() {
  return (
    <Suspense fallback={null}>
      <TwoFactorLoginContentInner />
    </Suspense>
  );
}

