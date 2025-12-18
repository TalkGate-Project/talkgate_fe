"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import AuthLayout from "@/components/auth/AuthLayout";
import { AccountStep } from "@/components/signup/AccountStep";
import { VerifyStep } from "@/components/signup/VerifyStep";
import { ProfileStep } from "@/components/signup/ProfileStep";
import { DoneStep } from "@/components/signup/DoneStep";
import type { SignupStep } from "@/components/signup/steps";
import type { SignupTokens } from "@/types/signup";
import { getPendingInviteInfo } from "@/lib/invite";
import { setTokens } from "@/lib/token";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<SignupStep>("account");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  // 이메일 인증 성공 시 받은 토큰 (쿠키에 저장하지 않고 state로 관리)
  const [signupTokens, setSignupTokens] = useState<SignupTokens | null>(null);

  // URL에서 초대 토큰 가져오기 (또는 localStorage에서 가져오기)
  const pendingInvite = getPendingInviteInfo();
  const invitationToken = useMemo(() => {
    const urlToken = searchParams.get("invite");
    return urlToken || pendingInvite?.token || undefined;
  }, [searchParams, pendingInvite?.token]);
  
  // 초대 이메일 (초대 플로우에서는 이메일 고정)
  const inviteEmail = pendingInvite?.email || undefined;
  
  // 랜딩 페이지 등에서 리디렉션 URL을 받아옴
  const redirectUrl = searchParams.get("redirectUrl") || searchParams.get("returnUrl");
  
  // 초대 플로우 여부 (초대 토큰이 있으면 이메일 인증 스킵)
  const isInviteFlow = !!invitationToken;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // 토큰 저장 및 캐시 무효화 헬퍼
  const saveTokensAndInvalidateCache = async (tokens: SignupTokens) => {
    setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
  };

  const handleAccountSuccess = async (params: {
    email: string;
    password: string;
    tokens?: SignupTokens; // 초대 플로우에서는 회원가입 시 바로 토큰 반환
  }) => {
    setAccountEmail(params.email);
    setAccountPassword(params.password);
    
    // 초대 플로우인 경우 이메일 인증 스킵 + 휴대폰 본인인증도 스킵
    // 휴대폰 본인인증은 /invite/accept에서 한번만 받음 (중복 방지)
    if (isInviteFlow) {
      if (params.tokens) {
        // 토큰 저장 후 바로 초대 수락 페이지로 이동
        console.log("[SignupPage] 🎉 초대 플로우 - 토큰 저장 후 초대 수락 페이지로 바로 이동");
        await saveTokensAndInvalidateCache(params.tokens);
        window.location.href = "/invite/accept";
      } else {
        // 토큰이 없는 경우 → 로그인 후 초대 수락으로 이동해야 함
        console.log("[SignupPage] 🔑 초대 플로우 - 토큰 없음, 로그인 필요");
        window.location.href = "/login";
      }
      return;
    }
    
    // 일반 플로우: 이메일 인증 단계로
    setStep("verify");
  };

  // 이메일 인증 성공 시 토큰을 받아서 저장
  const handleVerifySuccess = (tokens: SignupTokens) => {
    setSignupTokens(tokens);
    setStep("profile");
  };

  const handleProfileComplete = () => {
    // 초대 플로우인 경우 → 초대 수락 페이지로 이동
    if (isInviteFlow) {
      console.log("[SignupPage] 🎉 초대 플로우 회원가입 완료 → 초대 수락 페이지로 이동");
      window.location.href = "/invite/accept";
      return;
    }
    
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
    // 초대 플로우인 경우 → 초대 수락 페이지로 이동
    if (isInviteFlow) {
      console.log("[SignupPage] 🎉 초대 플로우 회원가입 완료 (스킵) → 초대 수락 페이지로 이동");
      window.location.href = "/invite/accept";
      return;
    }
    
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

      {/* 단계별 회원가입 폼 영역 */}
      {step === "account" && (
        <AccountStep 
          onSuccess={handleAccountSuccess} 
          invitationToken={invitationToken}
          inviteEmail={inviteEmail}
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

