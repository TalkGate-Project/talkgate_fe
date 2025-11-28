"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TalkGateLogoLarge from "@/components/common/icons/TalkGateLogoLarge";
import TalkGateLogoWordmark from "@/components/common/icons/TalkGateLogoWordmark";
import loginBgImg from "@/assets/images/auth/login_bg.png";
import loginCardImg from "@/assets/images/auth/login_card.png";
import { AccountStep } from "@/components/signup/AccountStep";
import { VerifyStep } from "@/components/signup/VerifyStep";
import { ProfileStep } from "@/components/signup/ProfileStep";
import { DoneStep } from "@/components/signup/DoneStep";
import type { SignupStep } from "@/components/signup/steps";
import type { SignupTokens } from "@/types/signup";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("account");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  // 이메일 인증 성공 시 받은 토큰 (쿠키에 저장하지 않고 state로 관리)
  const [signupTokens, setSignupTokens] = useState<SignupTokens | null>(null);

  useEffect(() => {
    document.title = "TalkGate - 회원가입";
  }, []);

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
    router.replace("/projects");
    setStep("done");
  };

  const handleProfileSkip = () => {
    router.replace("/projects");
    setStep("done");
  };

  const handleGoLogin = () => {
    router.replace("/login");
  };

  return (
    // 메인 레이아웃 영역 시작
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('${loginBgImg.src}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 좌측 브랜드 영역 (로그인과 동일 레이아웃 유지) 시작 */}
      <div className="absolute left-0 top-0 h-screen w-[58vw] hidden lg:flex items-center pointer-events-none select-none">
        <div className="pl-[10vw] text-white flex flex-col items-center">
          <TalkGateLogoLarge />
          <div className="mt-4 text-white text-[32px] leading-[38px] font-medium">
            “Your Gateway to Smarter Sales”
          </div>
        </div>
      </div>
      {/* 좌측 브랜드 영역 (로그인과 동일 레이아웃 유지) 끝 */}

      {/* 우측 카드 영역 시작 */}
      <div
        className="
          absolute top-0 h-screen flex justify-center w-[594px]
          md:left-1/2 md:-translate-x-1/2
          lg:left-auto lg:translate-x-0 lg:right-[8vw]
          xl:right-[12vw]
        "
        style={{
          backgroundImage: `url('${loginCardImg.src}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "594px auto",
        }}
      >
        {/* 우측 카드 콘텐츠 컬럼 영역 시작 */}
        <div
          className="mx-auto flex flex-col items-center pt-[290px] w-[384px]"
          aria-label="signup-area"
        >
          {/* 워드마크 로고 (로그인 페이지와 동일) */}
          <TalkGateLogoWordmark />
          <h1 className="sr-only">회원가입</h1>

          {/* 단계별 회원가입 폼 영역 시작 */}
          {step === "account" && (
            <AccountStep onSuccess={handleAccountSuccess} />
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
          {/* 단계별 회원가입 폼 영역 끝 */}

        </div>
        {/* 우측 카드 콘텐츠 컬럼 영역 끝 */}
      </div>
      {/* 우측 카드 영역 끝 */}
    </main>
    // 메인 레이아웃 영역 끝
  );
}
