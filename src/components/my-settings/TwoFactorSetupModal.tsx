"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

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
    alert("시크릿 코드가 복사되었습니다.");
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      alert("6자리 인증 코드를 입력하세요.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-[14px] w-full max-w-[848px] shadow-[0px_13px_61px_rgba(169,169,169,0.366)]"
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6">
          <h2 className="text-[18px] font-semibold text-[#000000] leading-[1] tracking-[-0.02em]">
            2단계 인증 (2FA)
          </h2>
          <button
            onClick={onClose}
            className="text-[#B0B0B0] hover:text-[#808080] transition-colors cursor-pointer"
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

        {/* Step 1: 인증 앱 설정 */}
        <div className="px-7">
          <h3 className="text-[16px] font-semibold leading-[1] text-[#000000] tracking-[0.2px] mb-1">
            1단계 : 인증 앱 설정
          </h3>
          <p className="text-[14px] font-medium text-[#808080] leading-[1] mb-3">
            Google Authenticator, Authy 등의 인증 앱으로 아래 QR 코드를 스캔하세요.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50 mb-[30px]"></div>

          {/* QR Code Section */}
          <div className="bg-[#F8F8F8] rounded-[12px] p-4 flex gap-6">
            {/* QR Code */}
            <div className="w-[168px] h-[168px] flex-shrink-0 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  width={168}
                  height={168}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="text-[#808080] text-sm">QR 코드 로딩 중...</div>
              )}
            </div>

            {/* Manual Input Section */}
            <div className="flex flex-col justify-center">
              <p className="text-[14px] font-medium text-[#808080] leading-[1] tracking-[0.2px] mb-2">
                수동 입력 코드
              </p>
              <div className="flex gap-3 mb-2">
                <div className="flex items-center h-[34px] px-3 bg-white border border-[#E2E2E2] rounded-[5px] min-w-[307px]">
                  <span className="text-[14px] font-medium text-[#000000] tracking-[-0.02em]">
                    {secretCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="h-[34px] px-3 bg-[#252525] text-[#EDEDED] text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                >
                  복사
                </button>
              </div>
              <p className="text-[14px] font-medium text-[#808080] leading-[1]">
                QR 코드를 스캔할 수 없는 경우 위 코드를 수동으로 입력하세요.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: 인증 코드 입력 */}
        <div className="px-7 mt-[30px]">
          <h3 className="text-[16px] font-semibold leading-[1] text-[#000000] tracking-[0.2px] mb-1">
            2단계 : 인증 코드 입력
          </h3>
          <p className="text-[14px] font-medium text-[#808080] leading-[1] mb-3">
            인증 앱에서 생성된 6자리 코드를 입력하세요.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50 mb-4"></div>

          {/* Code Input Section */}
          <div className="bg-[#F8F8F8] rounded-[5px] px-6 py-3 flex items-center gap-3">
            {/* Code Input */}
            <div className="flex items-center h-[34px] px-3 py-2 bg-white border border-[#E2E2E2] rounded-[5px] w-[137px]">
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
                className="w-full text-[14px] font-medium tracking-[0.2em] text-center text-[#000000] placeholder:text-[#E2E2E2] bg-transparent outline-none"
              />
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="h-[34px] px-3 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] tracking-[-0.02em] hover:bg-[#F8F8F8] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              취소
            </button>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              className="h-[34px] px-3 bg-[#252525] text-[#EDEDED] text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || code.length !== 6}
            >
              {loading ? "인증 중..." : "인증"}
            </button>
          </div>
        </div>

        {/* Footer Divider */}
        <div className="w-full h-[1px] bg-[#E2E2E2] mt-8"></div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-7 py-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] tracking-[-0.02em] hover:bg-[#F8F8F8] transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleVerify}
            className="px-3 py-1.5 bg-[#252525] text-[#EDEDED] text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || code.length !== 6}
          >
            {loading ? "인증 중..." : "인증완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
