"use client";

import { useState, useRef, useEffect } from "react";

type Step = "email" | "verify";

interface TwoFactorDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSendCode: () => Promise<void>;
  onDisable: (emailCode: string) => Promise<void>;
  loading?: boolean;
}

export default function TwoFactorDisableModal({
  isOpen,
  onClose,
  email,
  onSendCode,
  onDisable,
  loading = false,
}: TwoFactorDisableModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setCode("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const handleSendCode = async () => {
    try {
      await onSendCode();
      setStep("verify");
    } catch {
      // 에러 처리는 부모 컴포넌트에서 수행
    }
  };

  const handleDisable = async () => {
    if (code.length !== 6) {
      alert("6자리 인증 코드를 입력하세요.");
      return;
    }
    await onDisable(code);
  };

  const handleBack = () => {
    setStep("email");
    setCode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-[16px] w-full max-w-[480px] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-[20px] font-bold text-foreground">
            2FA 연결해제
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-40 hover:text-neutral-60 transition-colors cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-[30px] text-center">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.9986 15V18.3333M19.9986 25H20.0153M8.45159 31.6667H31.5456C34.1116 31.6667 35.7153 28.8889 34.4323 26.6667L22.8853 6.66667C21.6023 4.44444 18.3948 4.44444 17.1118 6.66667L5.56484 26.6667C4.28184 28.8889 5.88559 31.6667 8.45159 31.6667Z"
                  stroke="#D83232"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Warning Text */}
          <h3 className="text-[18px] leading-[1] font-bold text-danger-40 mb-3">
            2단계 인증(2FA)을 해제하시겠습니까?
          </h3>
          <p className="text-[14px] text-ink leading-[1.1] mb-3">
            2단계 인증을 해제하시면 보안에 취약해질 수 있습니다.
            <br />
            본인 확인을 위해 이메일 인증이 필요합니다. 계속 진행하시겠습니까?
          </p>

          {/* Input Field */}
          {step === "email" ? (
            <div className="px-6 h-[58px] bg-muted flex items-center justify-center">
              <input
                type="text"
                value={email}
                readOnly
                className="w-full h-[34px] px-4 bg-card border border-border rounded-[5px] text-[14px] text-foreground"
              />
            </div>
          ) : (
            <div className="px-6 h-[58px] bg-muted flex items-center justify-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCode(value);
                }}
                placeholder="인증번호 6자리 입력"
                className="w-full h-[34px] px-4 bg-card border border-border rounded-[5px] text-[14px] text-foreground tracking-[0.3em] font-mono"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-border">
          {step === "email" ? (
            <>
              <button
                onClick={onClose}
                className="h-[34px] px-3 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSendCode}
                className="h-[34px] px-3 bg-neutral-90 text-white dark:text-neutral-0 text-[14px] font-semibold rounded-[5px] hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                {loading ? "발송 중..." : "인증번호 발송"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="h-[34px] px-3 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                뒤로
              </button>
              <button
                onClick={handleDisable}
                className="h-[34px] px-3 bg-neutral-90 text-white text-[14px] font-semibold rounded-[5px] hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading || code.length !== 6}
              >
                {loading ? "처리 중..." : "해제완료"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
