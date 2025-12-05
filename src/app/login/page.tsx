"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { initiateSocialLogin } from "@/lib/oauth";
import Checkbox from "@/components/common/Checkbox";
import { getRememberMePreference, setRememberMePreference, clearTokens } from "@/lib/token";
import { getSelectedProjectId } from "@/lib/project";
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
            // 프로젝트가 선택되어 있으면 대시보드로, 아니면 프로젝트 선택으로
            const projectId = getSelectedProjectId();
            if (projectId) {
              console.log("[LoginPage] ✅ 이미 인증됨 + 프로젝트 있음 → 대시보드로 이동");
              router.replace("/dashboard");
            } else {
              console.log("[LoginPage] ✅ 이미 인증됨 + 프로젝트 없음 → 프로젝트 선택으로 이동");
              router.replace("/projects");
            }
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          // 인증 실패: 잔존 쿠키가 있을 수 있으므로 명시적으로 정리
          console.log("[LoginPage] ⚠️ 인증 확인 실패 - 쿠키 정리 후 로그인 폼 표시", err);
          clearTokens();
          setChecking(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [router, redirectUrl]);

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
          AuthService.login({ email, password })
            .then((res) => {
              const data = (res as any)?.data?.data;
              // Check if this is a 2FA required response
              if (data?.twoFactorToken) {
                // Navigate to 2FA login page with the token (리디렉션 URL 유지)
                const twoFactorUrl = redirectUrl 
                  ? `/login/two-factor?token=${data.twoFactorToken}&redirectUrl=${encodeURIComponent(redirectUrl)}`
                  : `/login/two-factor?token=${data.twoFactorToken}`;
                router.push(twoFactorUrl);
              } else {
                // Normal login success
                if (redirectUrl) {
                  // 리디렉션 URL이 있으면 해당 URL로 이동 (랜딩 페이지 등)
                  console.log("[LoginPage] ✅ 로그인 성공 + 리디렉션 URL 있음 →", redirectUrl);
                  window.location.href = redirectUrl;
                } else {
                  // 프로젝트 ID가 있으면 대시보드로, 없으면 프로젝트 선택으로
                  const projectId = getSelectedProjectId();
                  if (projectId) {
                    console.log("[LoginPage] ✅ 로그인 성공 + 프로젝트 있음 → 대시보드로 이동");
                    router.replace("/dashboard");
                  } else {
                    console.log("[LoginPage] ✅ 로그인 성공 + 프로젝트 없음 → 프로젝트 선택으로 이동");
                    router.replace("/projects");
                  }
                }
              }
            })
            .catch((err: any) => {
              const status = err?.status;
              const code = err?.data?.code;
              const msg = String(err?.data?.message || "").toUpperCase();
              if (status === 401 && code === "UNAUTHORIZED") {
                setInvalid(true);
              } else if (status === 401 && (msg.includes("INVALID") || msg.includes("UNAUTHORIZED"))) {
                setInvalid(true);
              } else {
                alert("로그인에 실패했습니다.");
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
