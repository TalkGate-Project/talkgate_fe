"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { initiateSocialLogin } from "@/lib/oauth";
import Checkbox from "@/components/common/Checkbox";
import { getRememberMePreference, setRememberMePreference } from "@/lib/token";
import { setSelectedProjectId } from "@/lib/project";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import AuthLayout from "@/components/auth/AuthLayout";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(getRememberMePreference());
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 랜딩 페이지 등에서 리디렉션 URL을 받아옴
  const redirectUrl = searchParams.get("redirectUrl") || searchParams.get("returnUrl");

  useEffect(() => {
    document.title = "TalkGate - 로그인";
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // 로그아웃 후 리다이렉트인 경우 쿠키 체크 건너뛰기
    // 쿠키 삭제가 완전히 적용되기 전에 페이지가 로드될 수 있음
    const isLogoutRedirect = searchParams.get('logout') === 'success';
    
    if (isLogoutRedirect) {
      console.log("[LoginPage] 🚪 로그아웃 후 리다이렉트 - 로그인 폼 표시");
      // 로그아웃 후에는 쿠키 체크를 건너뛰고 바로 로그인 폼 표시
      // 쿠키가 남아있어도 AuthService.me()가 실패할 것이므로 자동으로 로그인 폼이 표시됨
      // URL에서 logout 파라미터 제거 (히스토리 정리)
      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
      setChecking(false);
      return;
    }
    
    // 인증 유효성 실제 확인 후에만 이동 (쿠키 존재만으로는 리다이렉트하지 않음)
    AuthService.me()
      .then(() => {
        if (mounted) {
          // 이미 인증된 상태
          if (redirectUrl) {
            // 리디렉션 URL이 있으면 해당 URL로 이동 (랜딩 페이지 등)
            console.log("[LoginPage] ✅ 이미 인증됨 + 리디렉션 URL 있음 →", redirectUrl);
            window.location.href = redirectUrl;
          } else {
            // 인증된 플로우는 반드시 서브도메인이 필요하므로
            // 로그인 페이지에서는 항상 /projects로 이동
            console.log("[LoginPage] ✅ 이미 인증됨 → 프로젝트 선택으로 이동 (서브도메인 필수)");
            router.replace("/projects");
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          // 인증 실패: httpOnly 쿠키는 서버에서만 관리되므로 클라이언트에서 삭제 불가
          console.log("[LoginPage] ⚠️ 인증 확인 실패 - 로그인 폼 표시", err);
          setChecking(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [router, redirectUrl, searchParams]);

  if (checking) return null;

  return (
    <AuthLayout ariaLabel="login-form-area">
      <h1 className="sr-only">로그인</h1>
      <form
        className="mt-6 w-full space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setInvalid(false);
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
              
              // 리다이렉션 처리
              // 쿠키가 설정되는 것을 보장하기 위해 window.location.href 사용
              if (redirectUrl) {
                // 리디렉션 URL이 있으면 해당 URL로 이동 (랜딩 페이지 등)
                console.log("[LoginPage] ✅ 로그인 성공 + 리디렉션 URL 있음 →", redirectUrl);
                window.location.href = redirectUrl;
              } else {
                // 인증된 플로우는 반드시 서브도메인이 필요하므로
                // 로그인 후 항상 /projects로 이동하여 프로젝트 선택 후 서브도메인으로 이동
                console.log("[LoginPage] ✅ 로그인 성공 → 프로젝트 선택으로 이동 (서브도메인 필수)");
                window.location.href = "/projects";
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
                alert(`로그인에 실패했습니다. ${err?.data?.message || err?.message || ""}`);
              }
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

        <button type="submit" className="cursor-pointer mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold">로그인</button>
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
            initiateSocialLogin("google");
          }}
        >
          <img src="/google.png" alt="" />
        </button>
      </div>

      {/* Signup link */}
      <div className="mt-6 text-[13px] text-[#BFBFBF]">
        계정이 없으신가요?{' '}
        <button
          type="button"
          className="cursor-pointer underline underline-offset-2 text-[#3690EB]"
          onClick={() => {
            const signupUrl = redirectUrl 
              ? `/signup?redirectUrl=${encodeURIComponent(redirectUrl)}`
              : "/signup";
            router.push(signupUrl);
          }}
        >
          회원가입
        </button>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout ariaLabel="login-form-area">
        <div className="text-center text-white text-xl">로딩 중...</div>
      </AuthLayout>
    }>
      <LoginContent />
    </Suspense>
  );
}
