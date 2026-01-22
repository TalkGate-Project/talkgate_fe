"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordService } from "@/services/forgotPassword";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import AuthLayout from "@/components/auth/AuthLayout";
import AsyncButton from "@/components/common/AsyncButton";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            setInvalid(false);
            setIsSubmitting(true);
            try {
              await ForgotPasswordService.requestResetEmail({ email });
              showErrorModal({
                type: "success",
                title: "이메일 전송 완료",
                headline: "인증 코드가 전송되었습니다",
                description: "입력하신 이메일로 인증 코드를 전송했습니다. 이메일을 확인해주세요.",
                hideCancel: true,
              });
              setStep("verify");
            } catch (error: any) {
              // 개발자용 로깅 (콘솔에만)
              console.error("Password reset email request failed:", error);
              
              // 사용자에게는 일반적인 친화적 메시지만 표시
              showErrorModal({
                type: "error",
                title: "이메일 전송 실패",
                headline: "이메일 전송에 실패했습니다",
                description: "잠시 후 다시 시도해주세요.",
                hideCancel: true,
              });
              setInvalid(true);
            } finally {
              setIsSubmitting(false);
            }
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
          <AsyncButton
            type="submit"
            variant="auth"
            size="md"
            fullWidth
            loading={isSubmitting}
            loadingText="전송 중..."
            className="mt-2"
          >
            다음
          </AsyncButton>
        </form>
      )}

      {step === "verify" && (
        <form
          className="mt-8 w-full space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            setInvalid(false);
            setIsSubmitting(true);
            try {
              const res: any = await ForgotPasswordService.verifyIdentity({ email, otp: code });
              const token = res?.data?.data?.resetToken || res?.data?.resetToken;
              if (token) setResetToken(String(token));
              showErrorModal({
                type: "success",
                title: "인증 완료",
                headline: "인증이 완료되었습니다",
                description: "새로운 비밀번호를 설정해주세요.",
                hideCancel: true,
              });
              setStep("reset");
            } catch (error: any) {
              // 개발자용 로깅 (콘솔에만)
              console.error("Identity verification failed:", error);
              
              // 사용자에게는 일반적인 친화적 메시지만 표시
              showErrorModal({
                type: "error",
                title: "인증 실패",
                headline: "인증에 실패했습니다",
                description: "인증번호를 다시 확인해주세요.",
                hideCancel: true,
              });
              setInvalid(true);
            } finally {
              setIsSubmitting(false);
            }
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
          <AsyncButton
            type="submit"
            variant="auth"
            size="md"
            fullWidth
            loading={isSubmitting}
            loadingText="확인 중..."
            className="mt-2"
          >
            다음
          </AsyncButton>
        </form>
      )}

      {step === "reset" && (
        <form
          className="mt-8 w-full space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            setInvalid(false);
            if (!passwordStrong || password !== passwordConfirm) {
              setInvalid(true);
              return;
            }
            setIsSubmitting(true);
            try {
              await ForgotPasswordService.setNewPassword({ resetToken, newPassword: password });
              showErrorModal({
                type: "success",
                title: "비밀번호 변경 완료",
                headline: "비밀번호가 성공적으로 변경되었습니다",
                description: "새로운 비밀번호로 로그인해주세요.",
                hideCancel: true,
                onConfirm: () => {
                  setStep("done");
                },
              });
            } catch (error: any) {
              // 개발자용 로깅 (콘솔에만)
              console.error("Password reset failed:", error);
              
              // 사용자에게는 일반적인 친화적 메시지만 표시
              showErrorModal({
                type: "error",
                title: "비밀번호 변경 실패",
                headline: "비밀번호 변경에 실패했습니다",
                description: "잠시 후 다시 시도해주세요.",
                hideCancel: true,
              });
              setInvalid(true);
            } finally {
              setIsSubmitting(false);
            }
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
          <AsyncButton
            type="submit"
            variant="auth"
            size="md"
            fullWidth
            loading={isSubmitting}
            loadingText="저장 중..."
            className="mt-2"
          >
            완료
          </AsyncButton>
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

