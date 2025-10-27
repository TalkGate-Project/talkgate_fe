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
      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${
        enabled ? "bg-[#00E272]" : "bg-[#E2E2E2]"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationTab() {
  const [webPushEnabled, setWebPushEnabled] = useState(true);

  return (
    <div className="bg-white rounded-[14px] p-8">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-[#252525] mb-4">
        알림 설정
      </h1>

      {/* Sub-title */}
      <h2 className="text-[16px] font-semibold text-[#000000] mb-6">
        알림방식
      </h2>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] mb-6"></div>

      {/* Web Push Notification */}
      <div className="flex items-center justify-between py-3 px-6 rounded-[5px] mb-6">
        <div className="flex-1">
          <div className="text-[16px] font-semibold text-[#000000] mb-1">
            웹 푸시 알림
          </div>
          <div className="text-[14px] font-medium text-[#808080]">
            브라우저에서 실시간 알림을 받습니다.
          </div>
        </div>
        <Toggle
          enabled={webPushEnabled}
          onChange={setWebPushEnabled}
        />
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] opacity-60 mb-6"></div>

      {/* Activation Status */}
      {webPushEnabled && (
        <div className="bg-[rgba(214,250,232,0.3)] rounded-[5px] py-3 px-6">
          <div className="text-[14px] font-medium text-[#00B55B]">
            웹 푸시 알림이 활성화되었습니다.
          </div>
        </div>
      )}
    </div>
  );
}

