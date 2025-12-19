"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordService } from "@/services/forgotPassword";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import AuthLayout from "@/components/auth/AuthLayout";

type Step = "email" | "verify" | "reset" | "done";

export default function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const passwordHasUpper = useMemo(() => /[A-Z]/.test(password), [password]);
  const passwordHasLower = useMemo(() => /[a-z]/.test(password), [password]);
  const passwordHasDigit = useMemo(() => /\d/.test(password), [password]);
  const passwordHasSpecial = useMemo(() => /[^A-Za-z0-9]/.test(password), [password]);
  const passwordStrong = passwordValid && passwordHasUpper && passwordHasLower && passwordHasDigit && passwordHasSpecial;
  const [pwdTouched, setPwdTouched] = useState(false);
  const missingRules = useMemo(() => {
    const arr: string[] = [];
    if (!passwordValid) arr.push("8자 이상");
    if (!passwordHasUpper) arr.push("대문자 포함");
    if (!passwordHasLower) arr.push("소문자 포함");
    if (!passwordHasDigit) arr.push("숫자 포함");
    if (!passwordHasSpecial) arr.push("특수문자 포함");
    return arr;
  }, [passwordValid, passwordHasUpper, passwordHasLower, passwordHasDigit, passwordHasSpecial]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <AuthLayout ariaLabel="forgot-password-area">
      <h1 className="sr-only">비밀번호 찾기</h1>

      {step === "email" && (
        <form
          className="mt-8 w-full space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setInvalid(false);
            ForgotPasswordService.requestResetEmail({ email })
              .then(() => setStep("verify"))
              .catch(() => setInvalid(true));
          }}
        >
          <div className="text-[#BFBFBF] text-[12px] mb-1">비밀번호를 찾고자 하는 이메일을 입력해주세요.</div>
          <label className={`block text-[12px] mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>이메일</label>
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={invalid ? "이메일을 다시 입력하세요" : "이메일을 입력하세요"}
            className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 text-white ${invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"}`}
            autoComplete="email"
          />
          <button type="submit" className="mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold">다음</button>
        </form>
      )}

      {step === "verify" && (
        <form
          className="mt-8 w-full space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setInvalid(false);
            ForgotPasswordService.verifyIdentity({ email, otp: code })
              .then((res: any) => {
                const token = res?.data?.data?.resetToken || res?.data?.resetToken;
                if (token) setResetToken(String(token));
                setStep("reset");
              })
              .catch(() => setInvalid(true));
          }}
        >
          <div className="text-[#BFBFBF] text-[12px] mb-1">등록된 핸드폰 번호로 인증번호를 요청하세요.</div>
          <label className="block text-[#CECECE] text-[12px] mb-1">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
          />
          <label className="block text-[#CECECE] text-[12px] mt-3 mb-1">핸드폰 번호</label>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="핸드폰 번호를 입력하세요"
              className="flex-1 h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
            />
            <button type="button" className="px-3 rounded-[5px] bg-[#2F2F2F] text-[#D0D0D0] text-[13px]">번호전송</button>
          </div>
          <label className="block text-[#CECECE] text-[12px] mt-3 mb-1">인증번호</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="인증번호를 입력하세요"
            className="w-full h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
          />
          <button type="submit" className="mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold">다음</button>
        </form>
      )}

      {step === "reset" && (
        <form
          className="mt-8 w-full space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setInvalid(false);
            if (!passwordStrong || password !== passwordConfirm) {
              setInvalid(true);
              return;
            }
            ForgotPasswordService.setNewPassword({ resetToken, newPassword: password })
              .then(() => setStep("done"))
              .catch(() => setInvalid(true));
          }}
        >
          <div className="text-[#BFBFBF] text-[12px] mb-1">새로운 비밀번호를 입력하세요.</div>
          <label className={`block text-[12px] mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>새 비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호"
              className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 pr-12 text-white ${invalid ? "border-[#FF5A5A]" : "border-[#555555]"}`}
              autoComplete="new-password"
              onBlur={() => setPwdTouched(true)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
            </button>
          </div>
          {(pwdTouched || invalid) && !passwordStrong && (
            <div className="mt-2 text-[12px] text-[#FF5A5A]">비밀번호가 규칙에 맞지 않습니다: {missingRules.join(", ")}</div>
          )}
          <label className={`block text-[12px] mt-3 mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>새 비밀번호 확인</label>
          <div className="relative">
            <input
              type={showPasswordConfirm ? "text" : "password"}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호 확인"
              className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 pr-12 text-white ${invalid ? "border-[#FF5A5A]" : "border-[#555555]"}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPasswordConfirm ? <EyeOnIcon /> : <EyeOffIcon />}
            </button>
          </div>
          <button type="submit" className="mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold">완료</button>
          <div className="mt-3 text-[12px] text-[#9CA3AF]">영문, 숫자, 특수문자 포함 8자 이상 입력해주세요.</div>
        </form>
      )}

      {step === "done" && (
        <div className="mt-8 w-full text-center text-white">
          비밀번호가 성공적으로 변경되었습니다.
          <div className="mt-4">
            <button
              className="px-4 h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold"
              onClick={() => router.replace("/login")}
            >
              로그인 하러가기
            </button>
          </div>
        </div>
      )}

      {step !== "done" && (
        <div className="mt-6 text-[13px] text-[#BFBFBF]">
          비밀번호를 찾으셨나요?{' '}
          <button type="button" className="underline underline-offset-2 hover:text-white" onClick={() => router.push("/login")}>
            로그인 화면으로
          </button>
        </div>
      )}
    </AuthLayout>
  );
}

