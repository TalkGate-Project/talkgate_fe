"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { getSelectedProjectId, setSelectedProjectId } from "@/lib/project";
import AuthLayout from "@/components/auth/AuthLayout";

function TwoFactorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totpCode, setTotpCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const twoFactorToken = searchParams.get("token");
  const redirectUrl = searchParams.get("redirectUrl") || searchParams.get("returnUrl");

  useEffect(() => {
    document.title = "TalkGate - 2단계 인증";
  }, []);

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
    setInvalid(false);
    setErrorMessage("");

    if (!totpCode || totpCode.length !== 6) {
      setInvalid(true);
      setErrorMessage("6자리 OTP 코드를 입력해주세요");
      return;
    }

    try {
      console.log("[TwoFactorLogin] 🔑 2FA 로그인 요청 시작");
      const res = await AuthService.twoFactorLogin({
        twoFactorToken,
        totpCode,
      });
      
      console.log("[TwoFactorLogin] 📥 2FA 로그인 응답:", res);
      const data = (res as any)?.data;
      
      // 서버에서 프로젝트 ID를 반환했으면 저장
      if (data?.projectId != null) {
        console.log("[TwoFactorLogin] 📁 서버에서 프로젝트 ID 받음:", data.projectId);
        setSelectedProjectId(data.projectId);
      }
      
      // 2FA 인증 성공 후 리디렉션
      if (redirectUrl) {
        // 리디렉션 URL이 있으면 해당 URL로 이동 (랜딩 페이지 등)
        console.log("[TwoFactorLogin] ✅ 2FA 인증 성공 + 리디렉션 URL 있음 →", redirectUrl);
        window.location.href = redirectUrl;
      } else {
        // 프로젝트 ID가 있으면 대시보드로, 없으면 프로젝트 선택으로
        const projectId = data?.projectId || getSelectedProjectId();
        console.log("[TwoFactorLogin] 📊 프로젝트 ID 확인:", { 
          fromResponse: data?.projectId, 
          fromCookie: getSelectedProjectId(),
          final: projectId 
        });
        
        // window.location.href 사용하여 페이지 전체 리로드 (쿠키 설정 보장)
        if (projectId) {
          console.log("[TwoFactorLogin] ✅ 2FA 인증 성공 + 프로젝트 있음 → 대시보드로 이동");
          window.location.href = "/dashboard";
        } else {
          console.log("[TwoFactorLogin] ✅ 2FA 인증 성공 + 프로젝트 없음 → 프로젝트 선택으로 이동");
          window.location.href = "/projects";
        }
      }
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
        className="mt-6 w-full space-y-3"
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

        <button 
          type="submit" 
          className="mt-4 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold hover:bg-[#303030] transition-colors"
          disabled={totpCode.length !== 6}
        >
          확인
        </button>
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

export default function TwoFactorLoginPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorLoginContent />
    </Suspense>
  );
}
