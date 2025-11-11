"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth";
import { buildOAuthAuthorizeUrl } from "@/lib/oauth";
import Checkbox from "@/components/common/Checkbox";
import { getRememberMePreference, setRememberMePreference } from "@/lib/token";
import TalkGateLogoLarge from "@/components/common/icons/TalkGateLogoLarge";
import TalkGateLogoWordmark from "@/components/common/icons/TalkGateLogoWordmark";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import loginBgImg from "@/assets/images/auth/login_bg.png";
import loginCardImg from "@/assets/images/auth/login_card.png";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(getRememberMePreference());
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "TalkGate - 로그인";
  }, []);

  useEffect(() => {
    let mounted = true;
    // 인증 유효성 실제 확인 후에만 이동 (쿠키 존재만으로는 리다이렉트하지 않음)
    AuthService.me()
      .then(() => {
        if (mounted) router.replace("/dashboard");
      })
      .catch(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) return null;

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('${loginBgImg.src}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left half: brand logo + subtitle */}
      <div className="absolute left-0 top-0 h-screen w-[58vw] hidden lg:flex items-center pointer-events-none select-none">
        <div className="pl-[10vw] text-white flex flex-col items-center">
          <TalkGateLogoLarge />
          <div className="mt-4 text-white text-[32px] leading-[38px] font-medium">"Your Gateway to Smarter Sales"</div>
        </div>
      </div>
      {/* Right-side transparent container with card as background */}
      <div
        className="
          absolute top-0 h-screen flex justify-center
          md:left-1/2 md:-translate-x-1/2
          lg:left-auto lg:translate-x-0 lg:right-[8vw]
          xl:right-[12vw]
        "
        style={{
          // Responsive card width: keep 594px around 1440/1920, gently scale up on ultra-wide,
          // and cap to 92vw on small screens to avoid overflow.
          width: "min(92vw, clamp(594px, 30vw, 1080px))",
          backgroundImage: `url('${loginCardImg.src}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "100% auto",
        }}
      >
        {/* Logo + form column. Top -> logo at 337px from top of screen */}
        <div
          className="mx-auto flex flex-col items-center"
          aria-label="login-form-area"
          style={{
            // Inner column width scales with card width (≈340px at 594px card width)
            width: "min(90%, calc(min(92vw, clamp(594px, 30vw, 1080px)) * 0.572))",
            // Vertical offset aligns to the printed card artwork (≈330px at 594px)
            paddingTop: "calc(min(92vw, clamp(594px, 30vw, 1080px)) * 0.556)",
          }}
        >
          {/* Wordmark logo */}
          <TalkGateLogoWordmark />

          <h1 className="sr-only">로그인</h1>
          <form
            className="mt-6 w-full space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setInvalid(false);
              setRememberMePreference(autoLogin);
              AuthService.login({ email, password })
                .then(() => router.replace("/projects"))
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
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
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
                className="text-[12px] text-[#BFBFBF] underline-offset-2 hover:underline"
                onClick={() => router.push("/forgot-password")}
              >
                비밀번호 찾기
              </button>
            </div>

            <button type="submit" className="mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold">로그인</button>
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
              className="w-11 h-11 rounded-full"
              style={{ background: "#FEE500" }}
              onClick={() => {
                const url = buildOAuthAuthorizeUrl("kakao");
                window.location.href = url;
              }}
            >
              <img src="/kakao.png" alt="" />
            </button>
            <button
              aria-label="naver"
              className="w-11 h-11 rounded-full"
              style={{ background: "#03C75A" }}
              onClick={() => {
                const url = buildOAuthAuthorizeUrl("naver");
                window.location.href = url;
              }}
            >
              <img src="/naver.png" alt="" />
            </button>
            <button
              aria-label="google"
              className="w-11 h-11 rounded-full bg-[#353535]"
              onClick={() => {
                const url = buildOAuthAuthorizeUrl("google");
                window.location.href = url;
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
              className="underline underline-offset-2 hover:text-white"
              onClick={() => router.push("/signup")}
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


