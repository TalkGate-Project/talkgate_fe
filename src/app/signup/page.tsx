"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { AccountStep } from "@/components/signup/AccountStep";
import { VerifyStep } from "@/components/signup/VerifyStep";
import { ProfileStep } from "@/components/signup/ProfileStep";
import { DoneStep } from "@/components/signup/DoneStep";
import type { SignupStep } from "@/components/signup/steps";
import type { SignupTokens } from "@/types/signup";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<SignupStep>("account");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  // 이메일 인증 성공 시 받은 토큰 (쿠키에 저장하지 않고 state로 관리)
  const [signupTokens, setSignupTokens] = useState<SignupTokens | null>(null);

  // URL에서 초대 토큰 가져오기
  const invitationToken = useMemo(() => searchParams.get("invite") || undefined, [searchParams]);
  
  // 랜딩 페이지 등에서 리디렉션 URL을 받아옴
  const redirectUrl = searchParams.get("redirectUrl") || searchParams.get("returnUrl");

  useEffect(() => {
    document.title = invitationToken ? "TalkGate - 초대 회원가입" : "TalkGate - 회원가입";
  }, [invitationToken]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleAccountSuccess = (params: {
    email: string;
    password: string;
  }) => {
    setAccountEmail(params.email);
    setAccountPassword(params.password);
    setStep("verify");
  };

  // 이메일 인증 성공 시 토큰을 받아서 저장
  const handleVerifySuccess = (tokens: SignupTokens) => {
    setSignupTokens(tokens);
    setStep("profile");
  };

  const handleProfileComplete = () => {
    if (redirectUrl) {
      // 리디렉션 URL이 있으면 해당 URL로 이동 (랜딩 페이지 등)
      console.log("[SignupPage] ✅ 회원가입 성공 + 리디렉션 URL 있음 →", redirectUrl);
      window.location.href = redirectUrl;
    } else {
      router.replace("/projects");
    }
    setStep("done");
  };

  const handleProfileSkip = () => {
    if (redirectUrl) {
      // 리디렉션 URL이 있으면 해당 URL로 이동 (랜딩 페이지 등)
      console.log("[SignupPage] ✅ 회원가입 성공 (스킵) + 리디렉션 URL 있음 →", redirectUrl);
      window.location.href = redirectUrl;
    } else {
      router.replace("/projects");
    }
    setStep("done");
  };

  const handleGoLogin = () => {
    const loginUrl = redirectUrl 
      ? `/login?redirectUrl=${encodeURIComponent(redirectUrl)}`
      : "/login";
    router.replace(loginUrl);
  };

  return (
    <AuthLayout ariaLabel="signup-area">
      <h1 className="sr-only">회원가입</h1>

      {/* 초대 회원가입 안내 */}
      {invitationToken && step === "account" && (
        <div className="mb-4 p-3 rounded-lg bg-[#1a3a2a] border border-[#00E272]/30">
          <p className="text-[#00E272] text-[14px] text-center">
            프로젝트 초대를 통한 회원가입입니다
          </p>
        </div>
      )}

      {/* 단계별 회원가입 폼 영역 */}
      {step === "account" && (
        <AccountStep 
          onSuccess={handleAccountSuccess} 
          invitationToken={invitationToken}
        />
      )}

      {step === "verify" && (
        <VerifyStep
          email={accountEmail}
          onSuccess={handleVerifySuccess}
        />
      )}

      {step === "profile" && signupTokens && (
        <ProfileStep
          tokens={signupTokens}
          onComplete={handleProfileComplete}
          onSkip={handleProfileSkip}
        />
      )}

      {step === "done" && <DoneStep onGoLogin={handleGoLogin} />}
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <AuthLayout ariaLabel="signup-area">
        <div className="text-center text-white text-xl">로딩 중...</div>
      </AuthLayout>
    }>
      <SignupContent />
    </Suspense>
  );
}
