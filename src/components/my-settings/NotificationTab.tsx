"use client";

import { useState, useEffect } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "@/utils/notificationSettings";

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
        className={`w-4 h-4 rounded-full bg-neutral-0 dark:bg-neutral-90 transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationTab() {
  const [projectId, ready] = useSelectedProjectId();
  // 초기 렌더링 시 깜빡임 방지를 위해 off 상태로 시작
  const [consultationChatEnabled, setConsultationChatEnabled] = useState(false);
  const [newsEnabled, setNewsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 프로젝트가 준비되면 해당 프로젝트의 설정 로드
  useEffect(() => {
    if (!ready) return;
    
    const settings = getNotificationSettings(projectId);
    setConsultationChatEnabled(settings.consultationChat);
    setNewsEnabled(settings.news);
    setIsInitialized(true);
  }, [projectId, ready]);

  // 상담 채팅 알림 설정 변경 핸들러
  const handleConsultationChatChange = (enabled: boolean) => {
    if (!ready || !projectId) return;
    
    setConsultationChatEnabled(enabled);
    const settings = getNotificationSettings(projectId);
    const newSettings: NotificationSettings = {
      ...settings,
      consultationChat: enabled,
    };
    saveNotificationSettings(newSettings, projectId);
  };

  // 새로운 소식 알림 설정 변경 핸들러
  const handleNewsChange = (enabled: boolean) => {
    if (!ready || !projectId) return;
    
    setNewsEnabled(enabled);
    const settings = getNotificationSettings(projectId);
    const newSettings: NotificationSettings = {
      ...settings,
      news: enabled,
    };
    saveNotificationSettings(newSettings, projectId);
  };

  return (
    <div className="bg-card rounded-none md:rounded-[14px] min-h-screen md:min-h-0 pb-[140px]">
      {/* Title */}
      <h1 className="px-6 md:px-7 py-4 md:py-7 text-[20px] md:text-[24px] font-bold text-foreground">
        알림 설정
      </h1>

      <div className="border-b border-[#E2E2E266]"></div>

      {/* Notification Settings */}
      <div className="px-6 md:px-7 py-4 md:py-6">
        {/* 상담 채팅 */}
        <div className="flex items-center justify-between py-4 md:py-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-[14px] md:text-[16px] font-semibold text-foreground mb-1">
              상담 채팅
            </div>
            <div className="text-[12px] md:text-[14px] font-medium text-neutral-60">
              상담 채팅에서 실시간 알림을 받습니다.
            </div>
          </div>
          <div className="flex-shrink-0">
            <Toggle
              enabled={consultationChatEnabled}
              onChange={handleConsultationChatChange}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-b border-[#E2E2E266] my-4 md:my-4"></div>

        {/* 새로운 소식 */}
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-[14px] md:text-[16px] font-semibold text-foreground mb-1">
              새로운 소식
            </div>
            <div className="text-[12px] md:text-[14px] font-medium text-neutral-60">
              새로운 소식에서 실시간 알림을 받습니다.
            </div>
          </div>
          <div className="flex-shrink-0">
            <Toggle
              enabled={newsEnabled}
              onChange={handleNewsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}