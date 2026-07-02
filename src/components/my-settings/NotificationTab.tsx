"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe, type MeUser } from "@/hooks/useMe";
import { AuthService } from "@/services/auth";
import { showErrorModal } from "@/lib/errorModalEvents";

type NotificationKey = "consultationChat" | "news" | "organizationChat";

type NotificationState = Record<NotificationKey, boolean>;

const DEFAULT_NOTIFICATION_STATE: NotificationState = {
  consultationChat: false,
  news: false,
  organizationChat: false,
};

const PROFILE_FIELD_BY_KEY: Record<
  NotificationKey,
  "isAllowChatNotification" | "isAllowNewNotification" | "isAllowOrganizationChatNotification"
> = {
  consultationChat: "isAllowChatNotification",
  news: "isAllowNewNotification",
  organizationChat: "isAllowOrganizationChatNotification",
};

interface ToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, disabled = false, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
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
  const { user, loading } = useMe();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationState>(DEFAULT_NOTIFICATION_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);

  const serverSettings = useMemo<NotificationState>(() => {
    if (!user) return DEFAULT_NOTIFICATION_STATE;
    return {
      consultationChat: user.isAllowChatNotification,
      news: user.isAllowNewNotification,
      organizationChat: user.isAllowOrganizationChatNotification,
    };
  }, [user]);

  // 초기 상태는 모두 off이며, 사용자 정보를 받은 뒤 서버값으로 동기화
  useEffect(() => {
    if (loading) return;
    setSettings(serverSettings);
    setIsInitialized(true);
  }, [loading, serverSettings]);

  const handleToggleChange = async (key: NotificationKey, enabled: boolean) => {
    if (!isInitialized || !user || savingKey !== null) return;

    const prevSettings = settings;
    const field = PROFILE_FIELD_BY_KEY[key];

    setSettings((prev) => ({ ...prev, [key]: enabled }));
    setSavingKey(key);

    try {
      await AuthService.updateProfile({ [field]: enabled });

      queryClient.setQueryData<MeUser | null>(["auth", "user"], (prevUser) => {
        if (!prevUser) return prevUser;
        return { ...prevUser, [field]: enabled };
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    } catch (error) {
      console.error("Failed to update notification setting:", error);
      setSettings(prevSettings);
      showErrorModal({
        type: "error",
        headline: "알림 설정 저장에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const isToggleDisabled = !isInitialized || loading || savingKey !== null;

  return (
    <div className="bg-card rounded-none md:rounded-[14px] min-h-screen md:min-h-0 pb-[140px]">
      {/* Title */}
      <h1 className="px-6 md:px-7 py-4 md:py-7 text-[20px] md:text-[24px] font-bold text-foreground">
        알림 설정
      </h1>

      <div className="border-b border-[#e9e9e9] dark:!border-[#44444455]"></div>

      {/* Notification Settings */}
      <div className="px-6 md:px-7 py-0 md:py-6">
        {/* 상담 채팅 */}
        <div className="flex items-center justify-between py-6 md:py-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-[16px] leading-[1] font-semibold text-foreground mb-1">
              상담 채팅
            </div>
            <div className="text-[14px] leading-[1] font-medium text-neutral-60">
              상담 채팅에서 실시간 알림을 받습니다.
            </div>
          </div>
          <div className="flex-shrink-0">
            <Toggle
              enabled={settings.consultationChat}
              disabled={isToggleDisabled}
              onChange={(enabled) => {
                void handleToggleChange("consultationChat", enabled);
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-b border-[#e9e9e9] dark:!border-[#44444455] my-0 md:my-4"></div>

        {/* 새로운 소식 */}
        <div className="flex items-center justify-between py-6 md:py-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-[16px] leading-[1] font-semibold text-foreground mb-1">
              새로운 소식
            </div>
            <div className="text-[14px] leading-[1] font-medium text-neutral-60">
              새로운 소식에서 실시간 알림을 받습니다.
            </div>
          </div>
          <div className="flex-shrink-0">
            <Toggle
              enabled={settings.news}
              disabled={isToggleDisabled}
              onChange={(enabled) => {
                void handleToggleChange("news", enabled);
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-b border-[#e9e9e9] dark:!border-[#44444455] my-0 md:my-4"></div>

        {/* 직원 채팅 */}
        <div className="flex items-center justify-between py-6 md:py-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-[16px] leading-[1] font-semibold text-foreground mb-1">
              직원 채팅
            </div>
            <div className="text-[14px] leading-[1] font-medium text-neutral-60">
              직원 채팅에서 실시간 알림을 받습니다.
            </div>
          </div>
          <div className="flex-shrink-0">
            <Toggle
              enabled={settings.organizationChat}
              disabled={isToggleDisabled}
              onChange={(enabled) => {
                void handleToggleChange("organizationChat", enabled);
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="md:hidden w-full border-b border-[#e9e9e9] dark:!border-[#44444455] my-0 md:my-4"></div>
      </div>
    </div>
  );
}