"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { initiateSocialLogin } from "@/lib/oauth";
import Checkbox from "@/components/common/Checkbox";
import AsyncButton from "@/components/common/AsyncButton";
import { getRememberMePreference, setRememberMePreference } from "@/lib/token";
import { setSelectedProjectId } from "@/lib/project";
import { getPendingInviteInfo, clearPendingInviteInfo } from "@/lib/invite";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import AuthLayout from "@/components/auth/AuthLayout";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(getRememberMePreference());
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 랜딩 페이지 등에서 리디렉션 URL을 받아옴
  const redirectUrl = searchParams.get("redirectUrl") || searchParams.get("returnUrl");
  
  // 초대 플로우 확인
  const pendingInvite = getPendingInviteInfo();
  const isInviteFlow = !!pendingInvite?.token;

  useEffect(() => {
    // 초대 플로우인 경우 초대 이메일로 입력 필드 초기화
    if (pendingInvite?.email) {
      setEmail(pendingInvite.email);
    }
  }, [pendingInvite?.email]);

  // 인증 상태 확인 함수 (재사용)
  const checkAuthAndRedirect = () => {
    // 로그아웃 후 리다이렉트인 경우 쿠키 체크 건너뛰기
    const isLogoutRedirect = searchParams.get('logout') === 'success';
    
    if (isLogoutRedirect) {
      console.log("[LoginPage] 🚪 로그아웃 후 리다이렉트 - 로그인 폼 표시");
      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
      setChecking(false);
      return;
    }
    
    // 인증 유효성 실제 확인 후에만 이동
    AuthService.me()
      .then(() => {
        // 이미 인증된 상태
        const isAbsoluteUrl = redirectUrl && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://'));
        if (isAbsoluteUrl) {
          console.log("[LoginPage] ✅ 이미 인증됨 + 절대 리디렉션 URL 있음 →", redirectUrl);
          window.location.replace(redirectUrl);
        } else {
          console.log("[LoginPage] ✅ 이미 인증됨 → 프로젝트 선택으로 이동 (서브도메인 필수)");
          router.replace("/projects");
        }
      })
      .catch((err) => {
        console.log("[LoginPage] ⚠️ 인증 확인 실패 - 로그인 폼 표시", err);
        setChecking(false);
      });
  };

  useEffect(() => {
    checkAuthAndRedirect();
    
    // bfcache에서 복원될 때 인증 상태 재확인 (뒤로가기 시)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("[LoginPage] 🔄 bfcache에서 복원됨 - 인증 상태 재확인");
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
          console.log("[LoginPage] 🔑 로그인 요청 시작:", { email, hasRedirectUrl: !!redirectUrl });
          AuthService.login({ email, password, rememberMe: autoLogin })
            .then((res) => {
              console.log("[LoginPage] 📥 로그인 응답 전체:", res);
              const data = (res as any)?.data;
              console.log("[LoginPage] 📦 추출된 data:", data);
              
              // Check if this is a 2FA required response
              if (data?.requiresTwoFactor && data?.twoFactorToken) {
                // Navigate to 2FA login page with the token (리디렉션 URL 유지)
                const twoFactorUrl = redirectUrl 
                  ? `/login/two-factor?token=${data.twoFactorToken}&redirectUrl=${encodeURIComponent(redirectUrl)}`
                  : `/login/two-factor?token=${data.twoFactorToken}`;
                console.log("[LoginPage] 🔐 2FA 필요 →", twoFactorUrl);
                router.push(twoFactorUrl);
                return;
              }
              
              // Normal login success
              console.log("[LoginPage] ✅ 로그인 성공 확인");
              
              // 서버에서 프로젝트 ID를 반환했으면 저장 (나중에 프로젝트 선택 시 사용)
              if (data?.projectId != null) {
                console.log("[LoginPage] 📁 서버에서 프로젝트 ID 받음:", data.projectId);
                setSelectedProjectId(data.projectId);
              }
              
              // 초대 토큰 확인 - 저장된 초대 정보가 있으면 이메일 비교
              const pendingInvite = getPendingInviteInfo();
              if (pendingInvite?.token && pendingInvite?.email) {
                const inviteEmail = pendingInvite.email.toLowerCase();
                const loggedInEmail = email.toLowerCase();
                
                if (inviteEmail === loggedInEmail) {
                  // 이메일 일치 → 프로젝트 가입 페이지로 이동 (이름/연락처 입력)
                  console.log("[LoginPage] 🎉 초대 이메일 일치 → 프로젝트 가입 페이지로 이동");
                  window.location.href = "/project-signup";
                  return;
                } else {
                  // 이메일 불일치 → 초대 정보 삭제 후 경고 표시
                  console.log("[LoginPage] ⚠️ 초대 이메일 불일치:", { inviteEmail, loggedInEmail });
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
              
              // 리다이렉션 처리
              // window.location.replace() 사용하여 히스토리에서 로그인 페이지 제거 (뒤로가기 방지)
              // redirectUrl이 절대 URL(http:// 또는 https://)인 경우에만 해당 URL로 이동
              // 상대 경로인 경우 서브도메인 없이 이동하면 미들웨어에서 차단되므로 /projects로 이동
              const isAbsoluteUrl = redirectUrl && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://'));
              if (isAbsoluteUrl) {
                // 절대 URL인 경우에만 해당 URL로 이동 (랜딩 페이지 등)
                console.log("[LoginPage] ✅ 로그인 성공 + 절대 리디렉션 URL 있음 →", redirectUrl);
                window.location.replace(redirectUrl);
              } else {
                // 상대 경로이거나 redirectUrl이 없는 경우
                // 인증된 플로우는 반드시 서브도메인이 필요하므로 /projects로 이동
                if (redirectUrl) {
                  console.log("[LoginPage] ⚠️ 상대 경로 redirectUrl 무시:", redirectUrl);
                }
                console.log("[LoginPage] ✅ 로그인 성공 → 프로젝트 선택으로 이동 (서브도메인 필수)");
                window.location.replace("/projects");
              }
            })
            .catch((err: any) => {
              console.error("[LoginPage] ❌ 로그인 실패:", err);
              console.error("[LoginPage] ❌ 에러 상세:", {
                status: err?.status,
                code: err?.data?.code,
                message: err?.data?.message,
                error: err,
              });
              
              const status = err?.status;
              const code = err?.data?.code;
              const msg = String(err?.data?.message || "").toUpperCase();
              
              if (status === 401 && code === "UNAUTHORIZED") {
                setInvalid(true);
              } else if (status === 401 && (msg.includes("INVALID") || msg.includes("UNAUTHORIZED"))) {
                setInvalid(true);
              } else {
                showErrorModal({
                  title: "오류 발생",
                  headline: "로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.",
                  confirmText: "확인",
                  cancelText: null,
                  hideCancel: true,
                });
              }
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
            // 소셜 로그인 시 리디렉션 URL을 세션 스토리지에 저장
            if (redirectUrl) {
              sessionStorage.setItem("tg_redirect_url", redirectUrl);
            }
            // 초대 정보가 있으면 sessionStorage에도 백업 (OAuth 리다이렉트 후 복구용)
            if (pendingInvite?.token) {
              sessionStorage.setItem("tg_invite_backup", JSON.stringify(pendingInvite));
              console.log("[LoginPage] 💾 소셜 로그인 전 초대 정보 백업:", pendingInvite);
            }
            initiateSocialLogin("kakao");
          }}
        >
          <img src="/kakao.png" alt="" />
        </button>
        <button
          aria-label="naver"
          className="cursor-pointer w-11 h-11 rounded-full"
          style={{ background: "#03C75A" }}
          onClick={() => {
            if (redirectUrl) {
              sessionStorage.setItem("tg_redirect_url", redirectUrl);
            }
            if (pendingInvite?.token) {
              sessionStorage.setItem("tg_invite_backup", JSON.stringify(pendingInvite));
              console.log("[LoginPage] 💾 소셜 로그인 전 초대 정보 백업:", pendingInvite);
            }
            initiateSocialLogin("naver");
          }}
        >
          <img src="/naver.png" alt="" />
        </button>
        <button
          aria-label="google"
          className="cursor-pointer w-11 h-11 rounded-full bg-[#353535]"
          onClick={() => {
            if (redirectUrl) {
              sessionStorage.setItem("tg_redirect_url", redirectUrl);
            }
            if (pendingInvite?.token) {
              sessionStorage.setItem("tg_invite_backup", JSON.stringify(pendingInvite));
              console.log("[LoginPage] 💾 소셜 로그인 전 초대 정보 백업:", pendingInvite);
            }
            initiateSocialLogin("google");
          }}
        >
          <img src="/google.png" alt="" />
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

