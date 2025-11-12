"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import TalkGateLogoLarge from "@/components/common/icons/TalkGateLogoLarge";
import TalkGateLogoWordmark from "@/components/common/icons/TalkGateLogoWordmark";
import loginBgImg from "@/assets/images/auth/login_bg.png";
import loginCardImg from "@/assets/images/auth/login_card.png";

function TwoFactorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totpCode, setTotpCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const twoFactorToken = searchParams.get("token");

  useEffect(() => {
    document.title = "TalkGate - 2단계 인증";
  }, []);

  // Security: Redirect if no token provided
  useEffect(() => {
    if (!twoFactorToken) {
      router.replace("/login");
    }
  }, [twoFactorToken, router]);

  if (!twoFactorToken) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvalid(false);
    setErrorMessage("");

    if (!totpCode || totpCode.length !== 6) {
      setInvalid(true);
      setErrorMessage("6자리 OTP 코드를 입력해주세요");
      return;
    }

    try {
      await AuthService.twoFactorLogin({
        twoFactorToken,
        totpCode,
      });
      router.replace("/projects");
    } catch (err: any) {
      const status = err?.status;
      const code = err?.data?.code;
      
      if (status === 400 && code === "TWO_FACTOR_NOT_ENABLED") {
        setErrorMessage("2단계 인증이 활성화되지 않았습니다");
        setInvalid(true);
      } else if (status === 401 && code === "INVALID_TWO_FACTOR_TOKEN") {
        setErrorMessage("인증 시간이 만료되었습니다. 다시 로그인해주세요");
        setInvalid(true);
        setTimeout(() => router.replace("/login"), 2000);
      } else if (status === 401 && code === "INVALID_TWO_FACTOR_CODE") {
        setErrorMessage("OTP 코드가 올바르지 않습니다");
        setInvalid(true);
      } else {
        setErrorMessage("인증에 실패했습니다. 다시 시도해주세요");
        setInvalid(true);
      }
    }
  };

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
          width: "min(92vw, clamp(594px, 30vw, 1080px))",
          backgroundImage: `url('${loginCardImg.src}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "100% auto",
        }}
      >
        {/* Logo + form column */}
        <div
          className="mx-auto flex flex-col items-center"
          aria-label="two-factor-login-form-area"
          style={{
            width: "min(90%, calc(min(92vw, clamp(594px, 30vw, 1080px)) * 0.572))",
            paddingTop: "calc(min(92vw, clamp(594px, 30vw, 1080px)) * 0.556)",
          }}
        >
          {/* Wordmark logo */}
          <TalkGateLogoWordmark />

          <h1 className="sr-only">2단계 인증</h1>
          
          {/* Description */}
          <p className="mt-6 text-center text-[14px] text-[#CECECE] leading-relaxed">
            인증앱의 OTP를 확인해주세요.
          </p>

          <form
            className="mt-6 w-full space-y-3"
            onSubmit={handleSubmit}
          >
            <label className={`block text-[12px] mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>
              OTP 번호
            </label>
            <input
              name="totpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setTotpCode(value);
                if (invalid) {
                  setInvalid(false);
                  setErrorMessage("");
                }
              }}
              placeholder={invalid ? "코드를 다시 입력하세요" : "6자리 코드를 입력하세요"}
              className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 text-white text-center text-[18px] tracking-widest ${
                invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"
              }`}
              autoComplete="one-time-code"
              autoFocus
            />
            
            {errorMessage && (
              <p className="text-[12px] text-[#FF5A5A] text-center mt-2">
                {errorMessage}
              </p>
            )}

            <button 
              type="submit" 
              className="mt-4 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold hover:bg-[#303030] transition-colors"
              disabled={totpCode.length !== 6}
            >
              확인
            </button>
          </form>

          {/* Back to login link */}
          <div className="mt-6 text-[13px] text-[#BFBFBF]">
            <button
              type="button"
              className="cursor-pointer underline underline-offset-2 hover:text-[#3690EB] transition-colors"
              onClick={() => router.push("/login")}
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TwoFactorLoginPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorLoginContent />
    </Suspense>
  );
}

