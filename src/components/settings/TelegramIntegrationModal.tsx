"use client";

import { useState } from "react";

interface TelegramIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { botToken: string }) => Promise<void>;
}

export default function TelegramIntegrationModal({
  isOpen,
  onClose,
  onConfirm,
}: TelegramIntegrationModalProps) {
  const [botToken, setBotToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setBotToken("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!botToken.trim()) {
      alert("봇 토큰을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm({ botToken: botToken.trim() });
      handleClose();
    } catch (error) {
      console.error("Telegram integration failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={handleClose} />

      {/* Modal container */}
      <div className="relative w-[848px] bg-card dark:bg-neutral-10 rounded-[14px]">
        {/* Close button */}
        <button
          className="cursor-pointer absolute top-6 right-6 w-6 h-6 grid place-items-center hover:opacity-70 transition-opacity"
          aria-label="close"
          onClick={handleClose}
          disabled={isSaving}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              className="text-neutral-50 dark:text-neutral-50"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Body content with side padding */}
        <div className="px-7 pt-6 pb-6">
          <div className="mb-[30px]">
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              텔레그램 봇 연동
            </h2>
          </div>

          <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-6 py-3 mb-6">
            <p className="text-[14px] font-medium text-foreground dark:text-neutral-80 mb-2">
              텔레그램 봇 토큰 설정
            </p>
            <p className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 leading-6">
              봇 토큰을 얻는 방법
              <br />
              &nbsp;1. 텔레그램에서 @BotFather를 검색하여 대화를 시작합니다.
              <br />
              &nbsp;2. 채팅 입력창 좌측의 Open 버튼을 클릭하여 미니앱을 실행합니다.
              <br />
              &nbsp;3. Create a New Bot 버튼을 클릭합니다.
              <br />
              &nbsp;4. 생성 완료 후 봇 상세 화면에서 봇 토큰을 복사 합니다.
              <br />
              &nbsp;5. 아래 필드에 토큰을 입력하고 연동을 완료합니다.
            </p>

            <div className="mt-3">
              <label className="block text-[14px] leading-[24px] font-medium text-neutral-60 mb-2">
                봇 토큰
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGhIJKLMnopQRStuvWxYZ"
                className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 font-medium rounded-[5px] text-[14px] text-foreground dark:text-neutral-80 bg-card dark:bg-neutral-10 focus:outline-none focus:border-foreground dark:focus:border-neutral-80"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Full-width divider (ignores side padding) */}
        <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30" />

        {/* Footer buttons with side padding */}
        <div className="px-7 py-3 flex justify-end gap-3">
          <button
            className="cursor-pointer px-3 h-[34px] bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-foreground dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isSaving}
          >
            취소
          </button>
          <button
            className="cursor-pointer px-3 h-[34px] bg-neutral-90 dark:bg-neutral-80 text-neutral-20 dark:text-neutral-0 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? "연동 중..." : "연동"}
          </button>
        </div>
      </div>
    </div>
  );
}
