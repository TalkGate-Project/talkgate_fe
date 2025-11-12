"use client";

import { useState } from "react";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`cursor-pointer w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${
        enabled ? "bg-primary-60" : "bg-neutral-30"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-neutral-0 transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationTab() {
  const [consultationChatEnabled, setConsultationChatEnabled] = useState(true);
  const [newsEnabled, setNewsEnabled] = useState(true);

  return (
    <div className="bg-card rounded-[14px] pb-[140px]">
      {/* Title */}
      <h1 className="px-7 py-7 text-[24px] font-bold text-foreground">
        알림 설정
      </h1>

      <div className="border-b border-[#E2E2E266]"></div>

      {/* Notification Settings */}
      <div className="px-7 py-6">
        {/* 상담 채팅 */}
        <div className="flex items-center justify-between py-4">
          <div className="flex-1">
            <div className="text-[16px] font-semibold text-foreground mb-1">
              상담 채팅
            </div>
            <div className="text-[14px] font-medium text-neutral-60">
              상담 채팅에서 실시간 알림을 받습니다.
            </div>
          </div>
          <Toggle
            enabled={consultationChatEnabled}
            onChange={setConsultationChatEnabled}
          />
        </div>

        {/* Divider */}
        <div className="w-full border-b border-[#E2E2E266] my-4"></div>

        {/* 새로운 소식 */}
        <div className="flex items-center justify-between py-4">
          <div className="flex-1">
            <div className="text-[16px] font-semibold text-foreground mb-1">
              새로운 소식
            </div>
            <div className="text-[14px] font-medium text-neutral-60">
              새로운 소식에서 실시간 알림을 받습니다.
            </div>
          </div>
          <Toggle
            enabled={newsEnabled}
            onChange={setNewsEnabled}
          />
        </div>
      </div>
    </div>
  );
}