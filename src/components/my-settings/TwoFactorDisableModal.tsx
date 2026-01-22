"use client";

import { useState, useRef, useEffect } from "react";
import { showErrorModal } from "@/lib/errorModalEvents";

interface TwoFactorDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSendCode: () => Promise<void>;
  onDisable: (emailCode: string, totpCode: string) => Promise<void>;
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
  const [emailCode, setEmailCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const emailCodeInputRef = useRef<HTMLInputElement>(null);
  const totpCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEmailCode("");
      setTotpCode("");
      setIsCodeSent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isCodeSent) {
      setTimeout(() => {
        emailCodeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isCodeSent]);

  const handleSendCode = async () => {
    try {
      await onSendCode();
      setIsCodeSent(true);
    } catch {
      // 에러 처리는 부모 컴포넌트에서 수행
    }
  };

  const handleDisable = async () => {
    if (!emailCode || emailCode.length !== 6) {
      showErrorModal({
        type: "error",
        headline: "이메일 인증 코드를 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    if (!totpCode || totpCode.length !== 6) {
      showErrorModal({
        type: "error",
        headline: "OTP 인증 코드를 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    await onDisable(emailCode, totpCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-[#000000CC]" onClick={onClose} />

      {/* Modal - 모바일: 전체 너비, 데스크톱: 440px 고정 */}
      <div 
        className="relative bg-white dark:bg-neutral-10 rounded-[14px] w-full max-w-[440px] md:w-[440px] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4">
          <h2 className="text-[16px] md:text-[18px] font-semibold text-black dark:text-foreground leading-[21px]">
            2FA 연결해제
          </h2>
          <button
            onClick={onClose}
            className="text-[#B0B0B0] hover:text-neutral-60 transition-colors cursor-pointer w-6 h-6 flex items-center justify-center flex-shrink-0"
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
        <div className="px-4 pb-0 md:px-8">
          {/* Warning Icon */}
          <div className="flex justify-center mb-3 md:mb-4">
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

          {/* Warning Text */}
          <p className="text-[16px] md:text-[18px] font-semibold text-[#D83232] leading-[21px] text-center mb-4 md:mb-6">
            2단계 인증 해제를 위해<br />아래 인증 절차를 완료해 주세요.
          </p>

          {/* Input Fields Container - 모바일: 전체 너비, 데스크톱: 384px 고정 */}
          <div 
            className="w-full md:w-[384px] mx-auto flex flex-col bg-[#F8F8F8] dark:bg-muted rounded-[5px] mb-4 md:mb-6"
            style={{ padding: "12px 16px", gap: "16px" }}
          >
            {/* Email Verification Section */}
            <div className="w-full">
              <label className="block text-[14px] font-medium text-[#808080] dark:text-neutral-60 mb-2" style={{ letterSpacing: "0.2px" }}>
                이메일 인증
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={emailCodeInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setEmailCode(value);
                  }}
                  placeholder="인증번호 6자리 입력"
                  disabled={!isCodeSent}
                  className="flex-1 min-w-0 h-[34px] bg-white dark:bg-card border border-[#E2E2E2] dark:border-border rounded-[5px] text-[14px] text-black dark:text-foreground placeholder:text-neutral-60 dark:placeholder:text-neutral-60 tracking-[0.3em] font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ padding: "8px 12px" }}
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading || isCodeSent}
                  className="h-[34px] bg-[#252525] dark:bg-neutral-80 text-[#EDEDED] dark:text-neutral-0 text-[14px] font-semibold rounded-[5px] hover:opacity-90 dark:hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center flex-shrink-0 whitespace-nowrap"
                  style={{ padding: "6px 12px", letterSpacing: "-0.02em" }}
                >
                  {loading ? "발송 중..." : isCodeSent ? "발송됨" : "전송"}
                </button>
              </div>
            </div>

            {/* OTP Verification Section */}
            <div className="w-full">
              <label className="block text-[14px] font-medium text-[#808080] dark:text-neutral-60 mb-2" style={{ letterSpacing: "0.2px" }}>
                OTP 인증
              </label>
              <input
                ref={totpCodeInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setTotpCode(value);
                }}
                placeholder="인증번호 6자리 입력"
                className="w-full h-[34px] px-3 bg-white dark:bg-card border border-[#E2E2E2] dark:border-border rounded-[5px] text-[14px] text-black dark:text-foreground placeholder:text-neutral-60 dark:placeholder:text-neutral-60 tracking-[0.3em] font-mono"
                style={{ padding: "8px 12px" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E2E2E2] dark:border-border">
          <div className="flex justify-end gap-2 md:gap-3 px-4 py-3">
            <button
              onClick={onClose}
              className="h-[34px] border border-[#E2E2E2] dark:border-neutral-30 bg-white dark:bg-neutral-20 rounded-[5px] text-[14px] font-semibold text-black dark:text-neutral-0 hover:bg-muted dark:hover:bg-neutral-30 transition-colors cursor-pointer flex items-center justify-center flex-1 md:flex-initial"
              style={{ padding: "6px 12px", letterSpacing: "-0.02em" }}
            >
              취소
            </button>
            <button
              onClick={handleDisable}
              disabled={loading || !isCodeSent || emailCode.length !== 6 || totpCode.length !== 6}
              className="h-[34px] bg-[#252525] dark:bg-neutral-80 text-[#EDEDED] dark:text-neutral-0 text-[14px] font-semibold rounded-[5px] hover:opacity-90 dark:hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center flex-1 md:flex-initial"
              style={{ padding: "6px 12px", letterSpacing: "-0.02em" }}
            >
              {loading ? "처리 중..." : "확인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
