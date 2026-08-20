"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { showErrorModal } from "@/lib/errorModalEvents";
import BaseModal from "@/components/common/BaseModal";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeDataUrl: string;
  secretCode: string;
  onVerify: (code: string) => Promise<void>;
  loading?: boolean;
}

export default function TwoFactorSetupModal({
  isOpen,
  onClose,
  qrCodeDataUrl,
  secretCode,
  onVerify,
  loading = false,
}: TwoFactorSetupModalProps) {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode("");
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(secretCode);
    showErrorModal({
      type: "success",
      headline: "시크릿 코드가 복사되었습니다.",
      hideCancel: true,
    });
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      showErrorModal({
        type: "error",
        headline: "인증 코드를 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    await onVerify(code);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleCancel = () => {
    setCode("");
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      onClose={onClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel="2단계 인증 (2FA)"
      disableAutoContainerSizing
      containerClassName="relative bg-card dark:bg-neutral-10 rounded-none md:rounded-[14px] w-full h-full md:h-auto md:max-w-[848px] md:max-h-[90vh] overflow-y-auto flex flex-col drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-7 py-4 md:py-6">
          <div className="flex items-center gap-3">
            {/* Back Button - 모바일에서만 표시 */}
            <button
              onClick={onClose}
              className="md:hidden text-foreground hover:text-neutral-60 transition-colors cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h2 className="text-[18px] font-semibold text-foreground leading-[1] tracking-[-0.02em]">
              2단계 인증 (2FA)
            </h2>
          </div>
          {/* Close Button - 데스크탑에서만 표시 */}
          <button
            onClick={onClose}
            className="hidden md:block text-neutral-50 hover:text-neutral-60 transition-colors cursor-pointer"
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

        {/* Content - flex-1로 남은 공간 채우기 */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: 인증 앱 설정 */}
          <div className="px-4 md:px-7">
          <h3 className="text-[14px] md:text-[16px] font-semibold leading-[1] text-foreground tracking-[0.2px] mb-1">
            1단계 : 인증 앱 설정
          </h3>
          <p className="text-[12px] md:text-[14px] font-medium text-neutral-60 leading-[1] mb-3">
            Google Authenticator, Authy 등의 인증 앱으로 아래 QR 코드를 스캔하세요.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-border opacity-50 mb-4 md:mb-[30px]"></div>

          {/* QR Code Section */}
          <div className="bg-muted rounded-[12px] p-4 flex flex-col md:flex-row gap-4 md:gap-6">
            {/* QR Code */}
            <div className="w-full md:w-[168px] h-auto md:h-[168px] flex-shrink-0 flex items-center justify-center mx-auto md:mx-0">
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  width={168}
                  height={168}
                  className="object-contain w-full max-w-[168px] h-auto"
                  unoptimized
                />
              ) : (
                <div className="text-neutral-60 text-sm">QR 코드 로딩 중...</div>
              )}
            </div>

            {/* Manual Input Section */}
            <div className="flex flex-col justify-center flex-1 md:flex-initial">
              <p className="text-[12px] md:text-[14px] font-medium text-neutral-60 leading-[1] tracking-[0.2px] mb-2">
                수동 입력 코드
              </p>
              <div className="flex flex-row gap-3 mb-2">
                <div className="flex items-center h-[34px] px-3 bg-card border border-border rounded-[5px] flex-1 md:min-w-[307px]">
                  <span className="text-[12px] md:text-[14px] font-medium text-foreground tracking-[-0.02em] truncate">
                    {secretCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="h-[34px] px-3 bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-25 text-[12px] md:text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors cursor-pointer flex-shrink-0"
                >
                  복사
                </button>
              </div>
              <p className="text-[12px] md:text-[14px] font-medium text-neutral-60 leading-[1]">
                QR 코드를 스캔할 수 없는 경우 위 코드를 수동으로 입력하세요.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: 인증 코드 입력 */}
        <div className="px-4 md:px-7 mt-6 md:mt-[30px]">
          <h3 className="text-[14px] md:text-[16px] font-semibold leading-[1] text-foreground tracking-[0.2px] mb-1">
            2단계 : 인증 코드 입력
          </h3>
          <p className="text-[12px] md:text-[14px] font-medium text-neutral-60 leading-[1] mb-3">
            인증 앱에서 생성된 6자리 코드를 입력하세요.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-border opacity-50 mb-4"></div>

          {/* Code Input Section */}
          <div className="bg-muted rounded-[5px] px-4 md:px-6 py-3 flex flex-row items-center gap-3">
            {/* Code Input */}
            <div className="flex items-center h-[34px] px-3 py-2 bg-card border border-border rounded-[5px] flex-1 md:w-[137px] md:flex-initial">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={code ? code.split("").join(" ") : ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 6);
                  setCode(rawValue);
                }}
                placeholder="_ _ _ _ _ _"
                className="w-full text-[12px] md:text-[14px] font-medium tracking-[0.2em] text-center text-foreground placeholder:text-neutral-60 dark:placeholder:text-neutral-60 bg-transparent outline-none"
              />
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="h-[34px] px-3 bg-card border border-border rounded-[5px] text-[12px] md:text-[14px] font-semibold text-foreground tracking-[-0.02em] hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              disabled={loading}
            >
              취소
            </button>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              className="h-[34px] px-3 bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-25 text-[12px] md:text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              disabled={loading || code.length !== 6}
            >
              {loading ? "인증 중..." : "인증"}
            </button>
          </div>
        </div>
        </div>

        {/* Footer Divider */}
        <div className="w-full h-[1px] bg-border mt-6 md:mt-8"></div>

        {/* Footer - 모바일에서 하단 고정 */}
        <div className="flex justify-end gap-3 px-4 md:px-7 py-4 md:py-3 mt-auto md:mt-0">
          <button
            onClick={onClose}
            className="h-[34px] px-3 border border-border rounded-[5px] text-[12px] md:text-[14px] font-semibold text-foreground tracking-[-0.02em] hover:bg-muted transition-colors cursor-pointer w-full md:w-auto"
          >
            취소
          </button>
          <button
            onClick={handleVerify}
            className="h-[34px] px-3 bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-25 text-[12px] md:text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            disabled={loading || code.length !== 6}
          >
            {loading ? "인증 중..." : "인증완료"}
          </button>
        </div>
    </BaseModal>
  );
}
