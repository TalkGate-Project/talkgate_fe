"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/auth";
import { initiateSocialLogin } from "@/lib/oauth";
import Checkbox from "@/components/common/Checkbox";
import AsyncButton from "@/components/common/AsyncButton";
import { getRememberMePreference, setRememberMePreference } from "@/lib/token";
import { hasAuthTokenHint } from "@/lib/authSession";
import { setAuthSessionActive } from "@/lib/authSession";
import { setSelectedProjectId } from "@/lib/project";
import { getPendingInviteInfo, clearPendingInviteInfo } from "@/lib/invite";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import AuthLayout from "@/components/auth/AuthLayout";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { usePersistentModal } from "@/providers/PersistentModalProvider";
import { SignupService } from "@/services/signup";
import {
  getAllowedPostAuthRedirect,
  getPostAuthDestination,
} from "@/lib/postAuthRedirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const persistentModal = usePersistentModal();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(getRememberMePreference());
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedEmailDuplicate, setHasCheckedEmailDuplicate] = useState(false);
  
  // 랜딩 페이지 등에서 전달된 post-auth redirect는 allowlist를 통과한 값만 사용
  const redirectUrl = getAllowedPostAuthRedirect(
    searchParams.get("redirectUrl") || searchParams.get("returnUrl")
  );
  
  // 초대 플로우 확인
  const pendingInvite = getPendingInviteInfo();
  const isInviteFlow = !!pendingInvite?.token;

  useEffect(() => {
    // 초대 플로우인 경우 초대 이메일로 입력 필드 초기화
    if (pendingInvite?.email) {
      setEmail(pendingInvite.email);
    }
  }, [pendingInvite?.email]);

  // 초대 플로우에서 로그인 페이지로 진입했을 때 이메일 중복 체크
  useEffect(() => {
    // 초대 플로우이고, 이메일이 있고, 아직 체크하지 않은 경우에만 실행
    if (isInviteFlow && pendingInvite?.email && !hasCheckedEmailDuplicate && !checking) {
      const checkEmail = async () => {
        try {
          const result = await SignupService.checkEmailAvailable({ email: pendingInvite.email });
          const isDuplicate = !result.available; // available이 false면 중복
          
          setHasCheckedEmailDuplicate(true);
          
          if (isDuplicate) {
            // 이미 가입된 계정 → 로그인 안내 모달
            persistentModal.show({
              type: "system",
              title: "회원가입",
              headline: "회원가입을 진행해주세요.",
              description: `${pendingInvite.email} 계정으로 이미 가입되어 있어요.\n로그인 후 프로젝트에 합류하세요!`,
              confirmText: "로그인하기",
              hideCancel: true,
              onConfirm: () => {
                // 모달만 닫고 로그인 폼에서 계속 진행할 수 있도록
              },
            });
          } else {
            // 가입되지 않은 계정 → 회원가입 안내 모달
            persistentModal.show({
              type: "system",
              title: "회원가입",
              headline: "회원가입을 진행해주세요.",
              description: `${pendingInvite.email} 로 등록된 계정이 없어요.\n지금 가입하고 프로젝트 멤버들과 협업을 시작해 보세요!`,
              confirmText: "회원가입하기",
              hideCancel: true,
              onConfirm: () => {
                // 회원가입 페이지로 이동
                let signupUrl = "/signup";
                const params = new URLSearchParams();
                
                if (pendingInvite?.token) {
                  params.set("invite", pendingInvite.token);
                }
                if (redirectUrl) {
                  params.set("redirectUrl", redirectUrl);
                }
                
                if (params.toString()) {
                  signupUrl += `?${params.toString()}`;
                }
                
                router.push(signupUrl);
              },
            });
          }
        } catch (error) {
          console.error("[LoginPage] ❌ 이메일 중복 체크 실패:", error);
          // 에러가 발생해도 플로우를 계속 진행할 수 있도록
          setHasCheckedEmailDuplicate(true);
        }
      };
      
      checkEmail();
    }
  }, [isInviteFlow, pendingInvite?.email, pendingInvite?.token, hasCheckedEmailDuplicate, checking, persistentModal, redirectUrl, router]);

  // 인증 상태 확인 함수 (재사용)
  const checkAuthAndRedirect = () => {
    // 로그아웃 후 리다이렉트인 경우 쿠키 체크 건너뛰기
    const isLogoutRedirect = searchParams.get('logout') === 'success';
    
    if (isLogoutRedirect) {
      clearPendingInviteInfo();
      sessionStorage.removeItem("tg_invite_backup");
      sessionStorage.removeItem("tg_last_social_provider");

      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
      setChecking(false);
      return;
    }
    
    // 쿠키가 없으면 인증 확인 요청을 보내지 않음 (불필요한 401 요청 방지)
    const hasTokenHint = hasAuthTokenHint();
    
    if (!hasTokenHint) {
      setChecking(false);
      return;
    }
    
    // 인증 유효성 실제 확인 후에만 이동 (401 시 자동 로그아웃 방지)
    AuthService.me({ suppressAutoLogout: true })
      .then(() => {
        // 이미 인증된 상태
        window.location.replace(getPostAuthDestination(redirectUrl));
      })
      .catch((_err) => {
        setChecking(false);
      });
  };

  useEffect(() => {
    checkAuthAndRedirect();
    
    // bfcache에서 복원될 때 인증 상태 재확인 (뒤로가기 시)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setChecking(true);
        checkAuthAndRedirect();
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, redirectUrl, searchParams]);

  if (checking) return null;

  return (
    <AuthLayout ariaLabel="login-form-area">
      <h1 className="sr-only">로그인</h1>
      <form
        className="w-full space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;
          setInvalid(false);
          setIsSubmitting(true);
          setRememberMePreference(autoLogin);
          AuthService.login({ email, password, rememberMe: autoLogin })
            .then((res) => {
              const data = (res as any)?.data;
              
              // Check if this is a 2FA required response
              if (data?.requiresTwoFactor && data?.twoFactorToken) {
                // Navigate to 2FA login page with the token (리디렉션 URL 유지)
                const rememberMeParam = `rememberMe=${autoLogin ? "1" : "0"}`;
                const twoFactorUrl = redirectUrl 
                  ? `/login/two-factor?token=${data.twoFactorToken}&${rememberMeParam}&redirectUrl=${encodeURIComponent(redirectUrl)}`
                  : `/login/two-factor?token=${data.twoFactorToken}&${rememberMeParam}`;
                router.push(twoFactorUrl);
                return;
              }
              
              // Normal login success
              
              // 사용자 정보 캐시 무효화 (새로운 사용자 정보를 가져오기 위해)
              queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
              
              // 서버에서 프로젝트 ID를 반환했으면 저장 (나중에 프로젝트 선택 시 사용)
              if (data?.projectId != null) {
                setSelectedProjectId(data.projectId);
              }
              
              // 초대 토큰 확인 - 저장된 초대 정보가 있으면 이메일 비교
              const pendingInvite = getPendingInviteInfo();
              if (pendingInvite?.token && pendingInvite?.email) {
                const inviteEmail = pendingInvite.email.toLowerCase();
                const loggedInEmail = email.toLowerCase();
                
                if (inviteEmail === loggedInEmail) {
                  // 이메일 일치 → 프로젝트 가입 페이지로 이동 (이름/연락처 입력) 
                  window.location.href = "/project-signup";
                  return;
                } else {
                  // 이메일 불일치 → 초대 정보 삭제 후 경고 표시
                  clearPendingInviteInfo();
                  showErrorModal({
                    title: "알림",
                    headline: "초대받은 이메일과 다른 계정입니다.",
                    confirmText: "확인",
                    cancelText: null,
                    hideCancel: true,
                  });
                  // 에러 모달 표시 후 프로젝트 선택으로 이동
                  setTimeout(() => {
                    window.location.href = "/projects";
                  }, 100);
                  return;
                }
              }
              
              setAuthSessionActive();
              // 리다이렉션 처리
              // window.location.replace() 사용하여 히스토리에서 로그인 페이지 제거 (뒤로가기 방지)
              window.location.replace(getPostAuthDestination(redirectUrl));
            })
            .catch((err: any) => {
              const status = err?.status;
              const code = err?.data?.code;
              const msg = String(err?.data?.message || "").toUpperCase();
              
              // EMAIL_NOT_VERIFIED 에러 처리 (403 또는 401)
              if ((status === 403 || status === 401) && (code === "EMAIL_NOT_VERIFIED" || msg.includes("EMAIL_NOT_VERIFIED") || msg.includes("EMAIL NOT VERIFIED"))) {
                // 회원가입 페이지로 리다이렉트하면서 이메일과 verify step 정보 전달
                const signupUrl = `/signup?email=${encodeURIComponent(email)}&step=verify`;
                router.push(signupUrl);
                return;
              }

              // 소셜 계정으로 가입된 이메일인 경우 (비밀번호 미설정)
              const isSocialUser = code === "SOCIAL_USER_CANNOT_USE_PASSWORD";
              if (isSocialUser) {
                showErrorModal({
                  title: "알림",
                  headline: "소셜 계정으로 가입된 이메일입니다.",
                  confirmText: "확인",
                  cancelText: null,
                  hideCancel: true,
                });
                return;
              }
              
              const isInvalidCredentialMessage =
                msg.includes("INVALID EMAIL OR PASSWORD") ||
                (msg.includes("INVALID") && msg.includes("PASSWORD")) ||
                msg.includes("UNAUTHORIZED");

              const isInvalidCredentials =
                (status === 401 || status === 400) &&
                (code === "UNAUTHORIZED" || isInvalidCredentialMessage);

              if (isInvalidCredentials) {
                setInvalid(true);
                showErrorModal({
                  title: "로그인 실패",
                  headline: "이메일 또는 비밀번호가 올바르지 않습니다.",
                  confirmText: "확인",
                  cancelText: null,
                  hideCancel: true,
                });
                return;
              }

              showErrorModal({
                title: "오류 발생",
                headline: "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",
                confirmText: "확인",
                cancelText: null,
                hideCancel: true,
              });
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
      >
        <label className={`block text-[12px] mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>이메일</label>
        <input
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (invalid) setInvalid(false);
          }}
          placeholder={invalid ? "이메일을 다시 입력하세요" : "이메일을 입력하세요"}
          className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 text-white ${invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"}`}
          autoComplete="username"
        />
        <label className={`block text-[12px] mt-3 mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>비밀번호</label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (invalid) setInvalid(false);
            }}
            placeholder={invalid ? "비밀번호를 다시 입력하세요" : "비밀번호를 입력하세요"}
            className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 pr-12 text-white ${invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"}`}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
          </button>
        </div>

        {/* Options row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[13px] text-[#BFBFBF]">
            <Checkbox
              ariaLabel="자동 로그인 저장"
              checked={autoLogin}
              onChange={(next) => {
                setAutoLogin(next);
                setRememberMePreference(next);
              }}
              size={18}
            />
            <span>자동 로그인 저장</span>
          </div>
          <button
            type="button"
            className="cursor-pointer text-[12px] text-[#BFBFBF] underline-offset-2 hover:underline"
            onClick={() => router.push("/forgot-password")}
          >
            비밀번호 찾기
          </button>
        </div>

        <AsyncButton
          type="submit"
          variant="auth"
          size="md"
          fullWidth
          loading={isSubmitting}
          loadingText="로그인 중..."
          className="mt-2"
        >
          로그인
        </AsyncButton>
      </form>

      {/* Social buttons */}
      <div className="mt-5 w-full flex items-center gap-3 text-white/90">
        <div className="h-px flex-1 bg-white/20" />
        <div className="text-center text-[13px]">또는</div>
        <div className="h-px flex-1 bg-white/20" />
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          aria-label="kakao"
          className="cursor-pointer w-11 h-11 rounded-full"
          style={{ background: "#FEE500" }}
          onClick={() => {
            // 초대 정보가 있으면 sessionStorage에 백업 (OAuth 리다이렉트 후 복구용)
            if (pendingInvite?.token) {
              sessionStorage.setItem("tg_invite_backup", JSON.stringify(pendingInvite));
            }
            // returnUrl을 OAuth state 파라미터에 포함하여 전달
            initiateSocialLogin("kakao", redirectUrl || undefined);
          }}
        >
          <img src="/kakao.webp" alt="" />
        </button>
        <button
          aria-label="naver"
          className="cursor-pointer w-11 h-11 rounded-full"
          style={{ background: "#03C75A" }}
          onClick={() => {
            if (pendingInvite?.token) {
              sessionStorage.setItem("tg_invite_backup", JSON.stringify(pendingInvite));
            }
            // returnUrl을 OAuth state 파라미터에 포함하여 전달
            initiateSocialLogin("naver", redirectUrl || undefined);
          }}
        >
          <img src="/naver.webp" alt="" />
        </button>
        <button
          aria-label="google"
          className="cursor-pointer w-11 h-11 rounded-full bg-[#353535]"
          onClick={() => {
            if (pendingInvite?.token) {
              sessionStorage.setItem("tg_invite_backup", JSON.stringify(pendingInvite));
            }
            // returnUrl을 OAuth state 파라미터에 포함하여 전달
            initiateSocialLogin("google", redirectUrl || undefined);
          }}
        >
          <img src="/google.webp" alt="" />
        </button>
      </div>

      {/* Signup link */}
      <div className="mt-6 text-[13px] text-[#BFBFBF] text-center">
        계정이 없으신가요?{' '}
        <button
          type="button"
          className="cursor-pointer underline underline-offset-2 text-[#3690EB]"
          onClick={() => {
            // 초대 플로우인 경우 초대 토큰을 회원가입 페이지로 전달
            let signupUrl = "/signup";
            const params = new URLSearchParams();
            
            if (pendingInvite?.token) {
              params.set("invite", pendingInvite.token);
            }
            if (redirectUrl) {
              params.set("redirectUrl", redirectUrl);
            }
            
            if (params.toString()) {
              signupUrl += `?${params.toString()}`;
            }
            
            router.push(signupUrl);
          }}
        >
          회원가입
        </button>
      </div>
      
    </AuthLayout>
  );
}

