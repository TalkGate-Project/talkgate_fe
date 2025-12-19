"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SocialSignupForm } from "@/components/signup/SocialSignupForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthService } from "@/services/auth";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

function LoadingFallback() {
  return (
    <AuthLayout ariaLabel="social-signup-area">
      <div className="text-center text-white text-xl">로딩 중...</div>
    </AuthLayout>
  );
}

function SocialSignupPageContent() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // 로그인 상태 확인
        const meRes = await AuthService.me();
        const userData = (meRes as { data?: { data?: { isAllowTerms?: boolean } } })?.data?.data;
        
        if (!userData) {
          // 로그인되지 않은 상태 - 권한 없음
          console.log("[SocialSignup] ❌ 로그인되지 않음");
          showErrorModal({
            title: "접근 권한 없음",
            headline: "권한이 없는 페이지입니다.",
            description: "소셜 로그인을 통해 접근해주세요.",
            confirmText: "확인",
            cancelText: null,
            hideCancel: true,
            onConfirm: () => router.replace("/login"),
          });
          return;
        }
        
        // 이미 약관 동의가 완료된 사용자 - 권한 없음
        if (userData.isAllowTerms) {
          console.log("[SocialSignup] ❌ 이미 가입이 완료된 사용자");
          showErrorModal({
            title: "접근 권한 없음",
            headline: "이미 회원가입이 완료된 계정입니다.",
            description: "프로젝트 페이지로 이동합니다.",
            confirmText: "확인",
            cancelText: null,
            hideCancel: true,
            onConfirm: () => router.replace("/projects"),
          });
          return;
        }
        
        // 소셜 로그인 후 약관 미동의 상태 - 접근 허용
        console.log("[SocialSignup] ✅ 접근 허용");
        setIsAuthorized(true);
      } catch (error) {
        console.error("[SocialSignup] 접근 권한 확인 실패:", error);
        showErrorModal({
          title: "접근 권한 없음",
          headline: "권한이 없는 페이지입니다.",
          description: "소셜 로그인을 통해 접근해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
          onConfirm: () => router.replace("/login"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <SocialSignupForm />;
}

export default function SocialSignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SocialSignupPageContent />
    </Suspense>
  );
}

