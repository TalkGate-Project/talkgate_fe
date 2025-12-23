"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { TermsStep } from "@/components/signup/TermsStep";
import { PhoneVerificationStep } from "@/components/signup/PhoneVerificationStep";
import { WrongAccountModal } from "@/components/invite/WrongAccountModal";
import { getPendingInviteInfo, clearPendingInviteInfo } from "@/lib/invite";
import { AuthService } from "@/services/auth";

export type SocialSignupStep = "terms" | "phone" | "done";

export function SocialSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<SocialSignupStep>("terms");
  const [showWrongAccountModal, setShowWrongAccountModal] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  
  // 초대 플로우 확인
  const pendingInvite = getPendingInviteInfo();
  const isInviteFlow = !!pendingInvite?.token;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // 약관 동의 완료
  const handleTermsComplete = () => {
    console.log("[SocialSignup] ✅ 약관 동의 완료 → 휴대폰 본인인증 단계");
    setStep("phone");
  };

  // 휴대폰 인증 완료 또는 스킵
  const handlePhoneComplete = () => {
    console.log("[SocialSignup] ✅ 휴대폰 인증 완료 → 프로젝트 가입 페이지로 이동");
    router.replace("/project-signup");
  };

  const handlePhoneSkip = () => {
    console.log("[SocialSignup] ⏭️ 휴대폰 인증 스킵 → 프로젝트 가입 페이지로 이동");
    router.replace("/project-signup");
  };

  // 회원가입 완료 후 리다이렉트
  const completeSignup = async () => {
    // 초대 플로우인 경우 → 이메일 비교 필요
    if (isInviteFlow && pendingInvite?.email) {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const meRes = await AuthService.me();
        const userData = (meRes as any)?.data?.data ?? (meRes as any)?.data;
        const currentEmail = userData?.email?.toLowerCase();
        const inviteEmail = pendingInvite.email.toLowerCase();
        
        console.log("[SocialSignup] 📧 이메일 비교:", { currentEmail, inviteEmail });
        
        if (currentEmail && inviteEmail && currentEmail !== inviteEmail) {
          // 이메일 불일치 → 모달 표시
          console.log("[SocialSignup] ⚠️ 이메일 불일치 - 모달 표시");
          setLoggedInEmail(userData?.email);
          setShowWrongAccountModal(true);
          return;
        }
      } catch (err) {
        console.error("[SocialSignup] 사용자 정보 조회 실패:", err);
        // 조회 실패 시에도 계속 진행 (초대 수락 페이지에서 다시 확인)
      }
      
      // 이메일 일치 또는 확인 불가 → 초대 수락 페이지로 이동
      console.log("[SocialSignup] 🎉 초대 플로우 - 초대 수락 페이지로 이동");
      window.location.href = "/invite/accept";
      return;
    }
    
    // 일반 플로우 → 프로젝트 선택 페이지로 이동
    console.log("[SocialSignup] 🎉 완료 - 프로젝트 선택으로 이동");
    router.replace("/projects");
  };

  // 잘못된 계정 모달에서 취소 클릭
  const handleWrongAccountCancel = () => {
    console.log("[SocialSignup] ❌ 이메일 불일치 - 취소, 초대 정보 삭제");
    clearPendingInviteInfo();
    setShowWrongAccountModal(false);
    router.replace("/projects");
  };

  // 잘못된 계정 모달에서 로그아웃 클릭
  const handleWrongAccountLogout = () => {
    console.log("[SocialSignup] 🔓 이메일 불일치 - 로그아웃 후 재로그인");
    // 초대 정보는 유지 (로그아웃 후 재로그인 시 필요)
    window.location.href = "/logout?returnUrl=" + encodeURIComponent("/login");
  };

  return (
    <>
      {/* 다른 계정으로 로그인된 경우 모달 */}
      {showWrongAccountModal && (
        <WrongAccountModal
          loggedInEmail={loggedInEmail}
          inviteEmail={pendingInvite?.email || null}
          onCancel={handleWrongAccountCancel}
          onLogout={handleWrongAccountLogout}
        />
      )}

      <AuthLayout ariaLabel="social-signup-area">
        <h1 className="sr-only">회원정보 등록</h1>

        {/* 초대 플로우 안내 */}
        {isInviteFlow && pendingInvite?.projectName && step === "terms" && (
          <div className="mb-4 p-3 rounded-lg bg-[#1a3a2a] border border-[#00E272]/30">
            <p className="text-[#00E272] text-[14px] text-center">
              "{pendingInvite.projectName}" 프로젝트 초대
            </p>
            <p className="text-[#B9B9B9] text-[12px] text-center mt-1">
              회원정보 등록을 완료해주세요.
            </p>
          </div>
        )}

        {/* 단계별 폼 */}
        {step === "terms" && (
          <TermsStep onComplete={handleTermsComplete} />
        )}

        {step === "phone" && (
          <PhoneVerificationStep 
            onComplete={handlePhoneComplete}
            onSkip={handlePhoneSkip}
          />
        )}
      </AuthLayout>
    </>
  );
}

