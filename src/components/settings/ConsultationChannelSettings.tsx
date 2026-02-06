"use client";

import { useState, useEffect } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { MessengerIntegrationService } from "@/services/messengerIntegration";
import LineIntegrationModal from "./LineIntegrationModal";
import TelegramIntegrationModal from "./TelegramIntegrationModal";
import type {
  Platform,
  MessengerIntegration,
} from "@/types/messengerIntegration";
import { showErrorModal } from "@/lib/errorModalEvents";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { env } from "@/lib/env";
const channels = [
  {
    id: "instagram" as Platform,
    name: "Instagram",
    description: "인스타그램 DM연동",
  },
  {
    id: "telegram" as Platform,
    name: "Telegram",
    description: "텔레그램 봇 연동",
  },
  {
    id: "line" as Platform,
    name: "LINE",
    description: "라인 공식 계정 연동",
  },
];

interface ChannelCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function ChannelCard({
  name,
  description,
  icon,
  isConnected,
  onConnect,
  onDisconnect,
}: ChannelCardProps) {
  return (
    <div className="flex items-center justify-between px-3 md:px-6 py-4 md:py-5 border border-neutral-30 rounded-lg min-h-[84px] md:min-h-[132px]">
      {/* Left Content - Icon and Text */}
      <div className="flex items-center">
        {/* Text Content */}
        <div className="flex items-center md:block gap-3 md:gap-0">
          {/* Icon */}
          <div className="w-8 h-8 mb-2">{icon}</div>

          <div>
            {/* Channel Name */}
            <h3 className="flex items-center md:block gap-2 md:gap-0 text-[16px] font-semibold text-foreground mb-1 leading-6">
              {name}
              {isConnected && (
                <div className="flex md:hidden items-center justify-center px-3 py-1 bg-primary-10 dark:bg-[#D6FAE8E5] rounded-[30px]">
                  <span className="text-[12px] font-medium text-primary-80 opacity-80 dark:text-primary-100 leading-[1]">
                    연결됨
                  </span>
                </div>
              )}
            </h3>

            {/* Description */}
            <p className="text-[14px] font-medium text-neutral-60 leading-6">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Right Content - Status and Button */}
      <div className="flex items-center gap-3">
        {isConnected && (
          <div className="hidden md:flex items-center justify-center px-3 py-1 bg-primary-10 dark:bg-[#D6FAE8E5] rounded-[30px]">
            <span className="text-[12px] font-medium text-primary-80 opacity-80 dark:text-primary-100 leading-[1]">
              연결됨
            </span>
          </div>
        )}

        <button
          onClick={isConnected ? onDisconnect : onConnect}
          className={`cursor-pointer flex items-center justify-center w-[72px] h-[34px] rounded-[5px] text-[14px] font-semibold ${
            isConnected
              ? "bg-card border border-border text-foreground hover:bg-neutral-10"
              : "bg-neutral-90 text-neutral-0 hover:opacity-90"
          } transition-colors`}
        >
          {isConnected ? "연결해제" : "연결하기"}
        </button>
      </div>
    </div>
  );
}

export default function ConsultationChannelSettings() {
  const [projectId] = useSelectedProjectId();
  const [integrations, setIntegrations] = useState<MessengerIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<Platform | null>(null);

  // 클라이언트 마운트 감지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 메신저 연동 목록 조회
  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!projectId || !mounted) return;

      setIsLoading(true);
      try {
        const response = await MessengerIntegrationService.list({
          "x-project-id": projectId,
        });

        if (response.data?.data) {
          setIntegrations(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch messenger integrations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, [projectId, mounted]);

  // Instagram OAuth 콜백에서 postMessage 받기
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // 보안: origin 검증
      // 콜백 페이지는 서브도메인 없는 URL (예: app-dev.talkgate.im)
      // 부모 창은 서브도메인 있는 URL일 수 있음 (예: project-xxx.app-dev.talkgate.im)
      // 서브도메인을 제거한 메인 도메인으로 비교
      try {
        const eventUrl = new URL(event.origin);
        const currentUrl = new URL(window.location.origin);

        // 서브도메인 제거한 메인 도메인 계산
        const getMainDomain = (hostname: string): string => {
          const parts = hostname.split(".");

          // 이미 메인 도메인인 경우 (app-dev.talkgate.im, app.talkgate.im 등)
          // parts.length가 3이고, 첫 번째가 'app' 또는 'app-dev'로 시작하면 메인 도메인
          if (
            parts.length === 3 &&
            (parts[0] === "app" || parts[0] === "app-dev")
          ) {
            return hostname;
          }

          // 서브도메인이 있는 경우 (project-xxx.app-dev.talkgate.im)
          // 첫 번째 부분을 제거하여 메인 도메인 추출
          if (parts.length > 3) {
            return parts.slice(1).join(".");
          }

          // parts.length가 2 이하인 경우 (localhost 등)는 그대로 반환
          return hostname;
        };

        const eventMainDomain = getMainDomain(eventUrl.hostname);
        const currentMainDomain = getMainDomain(currentUrl.hostname);

        // 프로토콜과 메인 도메인 일치 확인
        if (
          eventUrl.protocol !== currentUrl.protocol ||
          eventMainDomain !== currentMainDomain
        ) {
          console.warn("[Instagram] 허용되지 않은 origin:", {
            eventOrigin: event.origin,
            eventMainDomain,
            currentOrigin: window.location.origin,
            currentMainDomain,
          });
          return;
        }
      } catch (e) {
        // URL 파싱 실패 시 무시
        console.error("[Instagram] Origin 검증 실패:", e);
        return;
      }

      // Instagram 콜백 메시지 확인
      if (event.data?.type === "INSTAGRAM_OAUTH_CALLBACK") {
        const { code, error } = event.data;

        if (error) {
          console.error("[Instagram] OAuth 에러:", error);
          showErrorModal({
            type: "error",
            headline: "인스타그램 연동에 실패했습니다.",
            hideCancel: true,
          });
          return;
        }

        if (!code) {
          showErrorModal({
            type: "error",
            headline: "인증 코드를 받지 못했습니다.",
            hideCancel: true,
          });
          return;
        }

        // 프로젝트 ID 확인
        if (!projectId) {
          showErrorModal({
            type: "error",
            headline: "프로젝트 ID가 없습니다.",
            hideCancel: true,
          });
          return;
        }

        // 인스타그램 연동 API 호출
        try {
          const response = await MessengerIntegrationService.instagram(
            { code },
            { "x-project-id": projectId }
          );

          if (response?.data?.data) {
            setIntegrations((prev) => [...prev, response.data.data]);
            showErrorModal({
              type: "success",
              headline: "인스타그램 연동이 완료되었습니다.",
              hideCancel: true,
            });
          }
        } catch (error: any) {
          console.error("Failed to integrate Instagram:", error);
          showErrorModal({
            type: "error",
            headline: "인스타그램 연동에 실패했습니다.",
            hideCancel: true,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [projectId]);

  const channels = [
    {
      id: "instagram" as Platform,
      name: "Instagram",
      description: "인스타그램 DM연동",
    },
    {
      id: "telegram" as Platform,
      name: "Telegram",
      description: "텔레그램 봇 연동",
    },
    {
      id: "line" as Platform,
      name: "LINE",
      description: "라인 공식 계정 연동",
    },
  ];

  const isConnected = (platform: Platform) => {
    return integrations.some(
      (integration) => integration.platform === platform
    );
  };

  const connectedCount = integrations.length;

  const handleConnect = (platform: Platform) => {
    // 인스타그램은 OAuth 방식으로 처리
    if (platform === "instagram") {
      handleInstagramConnect();
      return;
    }
    setModalPlatform(platform);
  };

  const handleInstagramConnect = () => {
    // Instagram OAuth URL 구성
    const clientId = env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

    // 서브도메인 없이 콜백 URI 생성 (NEXT_PUBLIC_SITE_URL 사용)
    // NEXT_PUBLIC_SITE_URL이 없으면 현재 origin에서 서브도메인 제거
    let siteUrl = env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      const origin = window.location.origin;
      // 서브도메인 제거: https://project-xxx.app-dev.talkgate.im -> https://app-dev.talkgate.im
      const url = new URL(origin);
      const hostname = url.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        // 서브도메인이 있는 경우 제거 (첫 번째 부분 제거)
        const mainDomain = parts.slice(1).join(".");
        siteUrl = `${url.protocol}//${mainDomain}`;
      } else {
        siteUrl = origin;
      }
    }
    const redirectUri = `${siteUrl}/instagram/callback`;

    const scope = [
      "instagram_business_basic",
      "instagram_business_manage_messages",
    ].join(",");

    if (!clientId) {
      showErrorModal({
        type: "error",
        headline: "Instagram Client ID가 설정되지 않았습니다.",
        hideCancel: true,
      });
      return;
    }

    const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;

    // 새 창에서 Instagram 인증 페이지 열기
    window.open(
      instagramAuthUrl,
      "instagram_auth",
      "width=600,height=700,scrollbars=yes"
    );
  };

  const handleDisconnect = (platform: Platform) => {
    if (!projectId) return;

    const platformNames: Record<Platform, string> = {
      instagram: "인스타그램",
      telegram: "텔레그램",
      line: "라인",
    };

    showConfirmModal({
      title: "연동 해제",
      message: `${platformNames[platform]} 연동을 해제하시겠습니까?`,
      confirmText: "해제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await MessengerIntegrationService.remove(platform, {
            "x-project-id": projectId,
          });

          // 목록에서 제거
          setIntegrations((prev) =>
            prev.filter((integration) => integration.platform !== platform)
          );
          showErrorModal({
            type: "success",
            headline: "연동이 해제되었습니다.",
            hideCancel: true,
          });
        } catch (error) {
          console.error("Failed to disconnect messenger:", error);
          showErrorModal({
            type: "error",
            headline: "연동 해제에 실패했습니다.",
            hideCancel: true,
          });
        }
      },
    });
  };

  const handleConfirmIntegration = async (payload: any) => {
    if (!projectId || !modalPlatform) return;

    try {
      let response;

      switch (modalPlatform) {
        case "instagram":
          response = await MessengerIntegrationService.instagram(payload, {
            "x-project-id": projectId,
          });
          break;
        case "line":
          response = await MessengerIntegrationService.line(payload, {
            "x-project-id": projectId,
          });
          break;
        case "telegram":
          response = await MessengerIntegrationService.telegram(payload, {
            "x-project-id": projectId,
          });
          break;
      }

      if (response?.data?.data) {
        setIntegrations((prev) => [...prev, response.data.data]);
      }

      showErrorModal({
        type: "success",
        headline: "메신저 연동이 완료되었습니다.",
        hideCancel: true,
      });
    } catch (error: any) {
      console.error("Failed to integrate messenger:", error);
      showErrorModal({
        type: "error",
        headline: "메신저 연동에 실패했습니다.",
        hideCancel: true,
      });
      throw error;
    }
  };

  const renderIcon = (platform: Platform) => {
    switch (platform) {
      case "instagram":
        return (
          <div className="w-8 h-8">
            <img
              src="/icons/platform/instagram.png"
              alt="Instagram"
              className="w-full h-full"
            />
          </div>
        );
      case "telegram":
        return (
          <div className="w-8 h-8">
            <img
              src="/icons/platform/telegram.png"
              alt="Telegram"
              className="w-full h-full"
            />
          </div>
        );
      case "line":
        return (
          <div className="w-8 h-8">
            <img
              src="/icons/platform/line.png"
              alt="Line"
              className="w-full h-full"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Hydration 에러 방지
  if (!mounted || isLoading) {
    return (
      <div className="bg-card rounded-[14px] p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-20 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-neutral-20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-7 py-4.5 md:py-0 md:h-[76px]">
        <h1 className="text-[18px] md:text-[24px] font-bold text-foreground leading-5">
          상담 채널 연동
        </h1>
        <div className="flex items-center px-3 py-1 bg-primary-10 dark:bg-[#D6FAE8E5] rounded-[30px]">
          <span className="text-[12px] font-medium text-primary-80 opacity-80 dark:text-primary-100 leading-[1]">
            연결된 채널 : {connectedCount}개
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-70 mb-[30px]"></div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 px-6 md:px-7">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            name={channel.name}
            description={channel.description}
            icon={renderIcon(channel.id)}
            isConnected={isConnected(channel.id)}
            onConnect={() => handleConnect(channel.id)}
            onDisconnect={() => handleDisconnect(channel.id)}
          />
        ))}
      </div>

      {/* Integration Modals */}
      {modalPlatform === "line" && (
        <LineIntegrationModal
          isOpen={true}
          onClose={() => setModalPlatform(null)}
          onConfirm={handleConfirmIntegration}
          projectId={projectId || ""}
        />
      )}

      {modalPlatform === "telegram" && (
        <TelegramIntegrationModal
          isOpen={true}
          onClose={() => setModalPlatform(null)}
          onConfirm={handleConfirmIntegration}
        />
      )}
    </div>
  );
}
