"use client";

import { useState } from "react";
import type { Platform } from "@/types/messengerIntegration";

interface MessengerIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => Promise<void>;
  platform: Platform;
}

export default function MessengerIntegrationModal({
  isOpen,
  onClose,
  onConfirm,
  platform,
}: MessengerIntegrationModalProps) {
  // Instagram
  const [code, setCode] = useState("");
  
  // Line
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  
  // Telegram
  const [botToken, setBotToken] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setCode("");
    setChannelId("");
    setChannelSecret("");
    setBotToken("");
    onClose();
  };

  const handleSubmit = async () => {
    let payload: any;
    
    switch (platform) {
      case "instagram":
        if (!code.trim()) {
          alert("인증 코드를 입력해주세요.");
          return;
        }
        payload = { code: code.trim() };
        break;
      case "line":
        if (!channelId.trim() || !channelSecret.trim()) {
          alert("채널 ID와 시크릿을 모두 입력해주세요.");
          return;
        }
        payload = { channelId: channelId.trim(), channelSecret: channelSecret.trim() };
        break;
      case "telegram":
        if (!botToken.trim()) {
          alert("봇 토큰을 입력해주세요.");
          return;
        }
        payload = { botToken: botToken.trim() };
        break;
    }
    
    setIsSaving(true);
    try {
      await onConfirm(payload);
      handleClose();
    } catch (error) {
      console.error("Integration failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (platform) {
      case "instagram":
        return "인스타그램 연동";
      case "line":
        return "라인 채널 연동";
      case "telegram":
        return "텔레그램 봇 연동";
    }
  };

  const getSubtitle = () => {
    switch (platform) {
      case "instagram":
        return "인스타그램 인증 설정";
      case "line":
        return "라인 채널 설정";
      case "telegram":
        return "텔레그램 봇 토큰 설정";
    }
  };

  const renderInstructions = () => {
    switch (platform) {
      case "instagram":
        return (
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[14px] font-medium text-foreground mb-3">
              인스타그램 연동 방법:
            </div>
            <div className="text-[14px] font-medium text-neutral-60 leading-6">
              1. Facebook 개발자 센터에서 앱을 생성합니다.<br />
              2. Instagram 그래프 API를 활성화합니다.<br />
              3. OAuth 인증을 완료하고 인증 코드를 받습니다.<br />
              4. 아래 필드에 인증 코드를 입력하고 연동을 완료합니다.
            </div>
          </div>
        );
      case "line":
        return (
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[14px] font-medium text-foreground mb-3">
              라인 채널 연동 방법:
            </div>
            <div className="text-[14px] font-medium text-neutral-60 leading-6">
              1. LINE Developers Console에 접속합니다.<br />
              2. 새 Messaging API 채널을 생성합니다.<br />
              3. 채널 기본 설정에서 Channel ID를 복사합니다.<br />
              4. 채널 설정에서 Channel Secret을 복사합니다.<br />
              5. 아래 필드에 정보를 입력하고 연동을 완료합니다.
            </div>
          </div>
        );
      case "telegram":
        return (
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[14px] font-medium text-foreground mb-3">
              봇 토큰을 얻는 방법:
            </div>
            <div className="text-[14px] font-medium text-neutral-60 leading-6">
              1. 텔레그램에서 @BotFather를 검색하여 대화를 시작합니다.<br />
              2. 채팅 입력창 좌측의 Open 버튼을 클릭하여 미니앱을 실행합니다.<br />
              3. Create a New Bot 버튼을 클릭합니다.<br />
              4. 생성 완료 후 봇 상세 화면에서 봇 토큰을 복사 합니다.<br />
              5. 아래 필드에 토큰을 입력하고 연동을 완료합니다.
            </div>
          </div>
        );
    }
  };

  const renderInputFields = () => {
    switch (platform) {
      case "instagram":
        return (
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
        );
      case "line":
        return (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[14px] font-medium text-foreground mb-2">
                채널 ID
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="LINE 채널 ID"
                className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-foreground mb-2">
                채널 시크릿
              </label>
              <input
                type="password"
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
                placeholder="LINE 채널 시크릿"
                className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
                disabled={isSaving}
              />
            </div>
          </div>
        );
      case "telegram":
        return (
          <div className="mb-6">
            <label className="block text-[14px] font-medium text-foreground mb-2">
              봇 토큰
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="1234567890:ABCdefGhlJKimNoPQRSTUwxyZ"
              className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
              disabled={isSaving}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-[848px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
          disabled={isSaving}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              {getTitle()}
            </h2>
            <p className="text-[14px] font-medium text-neutral-60">
              {getSubtitle()}
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-border mb-6"></div>

          {/* Instructions */}
          {renderInstructions()}

          {/* Input Fields */}
          {renderInputFields()}

          {/* Divider */}
          <div className="w-full h-[1px] bg-border mb-6"></div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="cursor-pointer px-4 py-2 bg-white border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="cursor-pointer px-4 py-2 bg-neutral-90 text-neutral-20 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "연동 중..." : "연동"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

