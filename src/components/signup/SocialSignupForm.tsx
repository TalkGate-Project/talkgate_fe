"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { TermsStep } from "@/components/signup/TermsStep";
import { PhoneVerificationStep } from "@/components/signup/PhoneVerificationStep";
import { getPendingInviteInfo } from "@/lib/invite";
import { performLogout } from "@/lib/logout";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export type SocialSignupStep = "terms" | "phone" | "done";

export function SocialSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<SocialSignupStep>("terms");
  
  // 초대 플로우 확인
  const pendingInvite = getPendingInviteInfo();
  const isInviteFlow = !!pendingInvite?.token;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // 뒤로가기 감지 및 처리
  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      // 뒤로가기 감지 시 즉시 현재 페이지로 복원
      window.history.pushState(null, "", window.location.href);
      
      // 안내 모달 표시
      showErrorModal({
        type: "info",
        title: "만료된 페이지",
        headline: "회원가입이 진행 중인 페이지입니다.",
        description: "이미 회원가입 및 로그인에 성공했습니다. 로그아웃 하시겠습니까?",
        confirmText: "로그인 페이지로 이동",
        cancelText: "취소",
        hideCancel: false,
        onConfirm: () => {
          // 통합 로그아웃 함수 사용
          performLogout({
            redirectUrl: "/login",
          });
        },
      });
    };

    // 히스토리에 현재 상태 추가 (뒤로가기 감지용)
    window.history.pushState(null, "", window.location.href);

    // popstate 이벤트 리스너 등록
    window.addEventListener("popstate", handlePopState);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // 약관 동의 완료
  const handleTermsComplete = () => {
    setStep("phone");
  };

  // 휴대폰 인증 완료 또는 스킵
  const handlePhoneComplete = () => {
    router.replace("/project-signup");
  };

  const handlePhoneSkip = () => {
    router.replace("/project-signup");
  };

  return (
    <>
      <AuthLayout ariaLabel="social-signup-area">
        <h1 className="sr-only">회원정보 등록</h1>

        {/* 단계별 폼 */}
        {step === "terms" && (
          <TermsStep onComplete={handleTermsComplete} />
        )}

        {step === "phone" && (
          <PhoneVerificationStep 
            onComplete={handlePhoneComplete}
            onSkip={handlePhoneSkip}
            isInviteFlow={isInviteFlow}
          />
        )}
      </AuthLayout>
    </>
  );
}

