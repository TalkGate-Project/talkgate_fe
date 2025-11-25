"use client";

import { useState } from "react";

interface InstagramIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { code: string }) => Promise<void>;
}

export default function InstagramIntegrationModal({
  isOpen,
  onClose,
  onConfirm,
}: InstagramIntegrationModalProps) {
  const [code, setCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setCode("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert("인증 코드를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm({ code: code.trim() });
      handleClose();
    } catch (error) {
      console.error("Instagram integration failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative w-[848px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
        <button
          className="absolute top-6 right-6 w-6 h-6 grid place-items-center hover:opacity-70 transition-opacity"
          aria-label="close"
          onClick={handleClose}
          disabled={isSaving}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              인스타그램 연동
            </h2>
            <p className="text-[14px] font-medium text-neutral-60">
              Instagram OAuth 인증 코드를 입력해주세요.
            </p>
          </div>

          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <p className="text-[14px] font-medium text-foreground mb-3">
              연동 방법
            </p>
            <p className="text-[14px] font-medium text-neutral-60 leading-6">
              1. Facebook Developers에서 앱을 생성합니다.
              <br />
              2. Instagram Graph API 기능을 활성화합니다.
              <br />
              3. OAuth 인증을 진행하고 인증 코드를 발급받습니다.
              <br />
              4. 아래 코드 입력란에 인증 코드를 넣고 연동을 완료합니다.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-[14px] font-medium text-foreground mb-2">
              인증 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Instagram OAuth 인증 코드"
              className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="cursor-pointer px-4 py-2 bg-white border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              className="cursor-pointer px-4 py-2 bg-neutral-90 text-neutral-20 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? "연동 중..." : "연동"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






