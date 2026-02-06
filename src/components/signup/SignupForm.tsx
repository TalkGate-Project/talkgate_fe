"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { getPendingSignupState, savePendingSignupState, clearPendingSignupState } from "@/lib/signup";
import { SignupService } from "@/services/signup";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<SignupStep>("account");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  // 이메일 인증 성공 시 받은 토큰 (쿠키에 저장하지 않고 state로 관리)
  const [signupTokens, setSignupTokens] = useState<SignupTokens | null>(null);
  
  // 모달 표시 여부 추적 (중복 표시 방지)
  const modalShownRef = useRef(false);

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

  // 페이지 로드 시 저장된 회원가입 상태 복구
  useEffect(() => {
    // 초대 플로우가 아닌 경우에만 복구
    if (isInviteFlow) return;
    
    // 모달이 이미 표시되었으면 중복 실행 방지
    if (modalShownRef.current) return;
    
    // URL 파라미터에서 이메일과 step 확인 (로그인에서 리다이렉트된 경우)
    const urlEmail = searchParams.get("email");
    const urlStep = searchParams.get("step");
    
    if (urlEmail && urlStep === "verify") {
      // 로그인에서 리다이렉트된 경우: 이메일 인증 단계로 복원
      // 모달 표시 플래그 설정 (중복 방지)
      modalShownRef.current = true;
      
      setAccountEmail(urlEmail);
      
      // 상태 저장 (페이지 이탈 시에도 복구 가능하도록)
      savePendingSignupState({
        email: urlEmail,
        step: "verify",
      });
      
      // 정보성 모달 표시 후 단계로 이동
      showErrorModal({
        type: "info",
        headline: "",
        description: `작성중이던 ${urlEmail}에 대한\n회원가입 절차를 다시 진행합니다.`,
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          setStep("verify");
          // URL 파라미터 제거 (히스토리 정리)
          router.replace("/signup");
        },
      });
      return;
    }
    
    // URL 파라미터가 없는 경우: localStorage에서 복구
    const pendingState = getPendingSignupState();
    if (pendingState) {
      // 크로스 디바이스 이슈 해결: 서버에서 이메일 인증 완료 여부 확인
      // 다른 디바이스에서 이미 인증 완료했다면 localStorage 정리
      SignupService.checkEmailAvailable({ email: pendingState.email })
        .then((result) => {
          // 이메일이 이미 가입되어 있다면 (available: false) = 이미 인증 완료
          if (!result.available) {
            clearPendingSignupState();
            return;
          }
          
          // 아직 가입되지 않았다면 복구 진행
          // 모달 표시 플래그 설정 (중복 방지)
          modalShownRef.current = true;
          
          // 저장된 이메일과 단계로 복구
          setAccountEmail(pendingState.email);
          
          // 정보성 모달 표시 후 단계로 이동
          showErrorModal({
            type: "info",
            headline: "",
            description: `작성중이던 ${pendingState.email}에 대한\n회원가입 절차를 다시 진행합니다.`,
            hideCancel: true,
            confirmText: "확인",
            onConfirm: () => {
              setStep(pendingState.step);
            },
          });
        })
        .catch((error) => {
          // 에러 발생 시에도 복구 진행 (사용자 경험 우선)
          modalShownRef.current = true;
          setAccountEmail(pendingState.email);
          showErrorModal({
            type: "info",
            headline: "",
            description: `작성중이던 ${pendingState.email}에 대한\n회원가입 절차를 다시 진행합니다.`,
            hideCancel: true,
            confirmText: "확인",
            onConfirm: () => {
              setStep(pendingState.step);
            },
          });
        });
    }
  }, [isInviteFlow, searchParams, router]);

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
    agreeMarketing: boolean;
  }) => {
    setAccountEmail(params.email);
    setAccountPassword(params.password);
    
    // 마케팅 동의 알림 모달 표시
    const currentDate = format(new Date(), "yyyy년 MM월 dd일", { locale: ko });
    const marketingStatus = params.agreeMarketing ? "동의" : "거부";
    showErrorModal({
      type: "info",
      headline: "",
      description: `${currentDate} 마케팅 정보\n수신 ${marketingStatus} 처리 되었습니다.`,
      hideCancel: true,
      confirmText: "확인",
      onConfirm: () => {
        // 초대 플로우인 경우 이메일 인증 스킵
        // QA 요구사항: invitationToken을 넘겼다면 이메일 인증 절차는 필요 없음
        if (isInviteFlow) {
          if (params.tokens) {
            // 토큰을 저장하고 본인인증 단계로 이동
            // ⚠️ 이메일 인증은 스킵하지만 본인인증은 진행해야 함
            setSignupTokens(params.tokens);
            setStep("profile");
          } else {
            // 토큰이 없는 경우 → 로그인 후 초대 수락으로 이동해야 함
            window.location.href = "/login";
          }
          return;
        }
        
        // 일반 플로우: 이메일 인증 단계로
        setStep("verify");
      },
    });
  };

  // 이메일 인증 성공 시 토큰을 받아서 저장
  const handleVerifySuccess = (tokens: SignupTokens) => {
    setSignupTokens(tokens);
    setStep("profile");
  };

  const handleProfileComplete = () => {
    // 본인인증 완료 후
    if (isInviteFlow) {
      // 초대 플로우: 프로젝트 가입 페이지로 이동 (이름/전화번호 입력)
      window.location.href = "/project-signup";
    } else {
      // 일반 플로우: 프로젝트 가입 페이지 스킵하고 바로 프로젝트 선택 페이지로
      window.location.href = "/projects";
    }
  };

  const handleProfileSkip = () => {
    // 본인인증 스킵 후
    if (isInviteFlow) {
      // 초대 플로우: 프로젝트 가입 페이지로 이동
      window.location.href = "/project-signup";
    } else {
      // 일반 플로우: 프로젝트 가입 페이지 스킵하고 바로 프로젝트 선택 페이지로
      window.location.href = "/projects";
    }
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

      {/* 회원가입 완료 후 리다이렉트 중 로딩 표시 */}
      {step === "done" && <DoneStep />}
    </AuthLayout>
  );
}

