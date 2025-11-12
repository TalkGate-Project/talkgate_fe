"use client";

import { useState, useEffect } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { MessengerIntegrationService } from "@/services/messengerIntegration";
import MessengerIntegrationModal from "./MessengerIntegrationModal";
import LineIntegrationModal from "./LineIntegrationModal";
import type {
  Platform,
  MessengerIntegration,
} from "@/types/messengerIntegration";

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
    <div className="flex items-center justify-between p-6 border border-border rounded-[12px] min-h-[132px]">
      {/* Left Content - Icon and Text */}
      <div className="flex items-center">
        {/* Text Content */}
        <div>
          {/* Icon */}
          <div className="w-8 h-8 mb-2">{icon}</div>
          {/* Channel Name */}
          <h3 className="text-[16px] font-semibold text-foreground mb-1 leading-6">
            {name}
          </h3>

          {/* Description */}
          <p className="text-[14px] font-medium text-neutral-60 leading-6">
            {description}
          </p>
        </div>
      </div>

      {/* Right Content - Status and Button */}
      <div className="flex items-center gap-3">
        {isConnected && (
          <div className="flex items-center justify-center px-3 py-1 bg-primary-10 rounded-[30px]">
            <span className="text-[12px] font-medium text-primary-80 opacity-80">
              연결됨
            </span>
          </div>
        )}

        <button
          onClick={isConnected ? onDisconnect : onConnect}
          className={`cursor-pointer flex items-center justify-center px-4 py-2 rounded-[5px] text-[14px] font-semibold ${
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
    const clientId = "622214674056498";
    const redirectUri = `${window.location.origin}/instagram/callback`;
    const scope = [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
    ].join(",");

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

  const handleDisconnect = async (platform: Platform) => {
    if (!projectId || !confirm(`${platform} 연동을 해제하시겠습니까?`)) return;

    try {
      await MessengerIntegrationService.remove(platform, {
        "x-project-id": projectId,
      });

      // 목록에서 제거
      setIntegrations((prev) =>
        prev.filter((integration) => integration.platform !== platform)
      );
      alert("연동이 해제되었습니다.");
    } catch (error) {
      console.error("Failed to disconnect messenger:", error);
      alert("연동 해제에 실패했습니다.");
    }
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

      alert("메신저 연동이 완료되었습니다.");
    } catch (error: any) {
      console.error("Failed to integrate messenger:", error);
      const errorMessage =
        error?.data?.message || "메신저 연동에 실패했습니다.";
      alert(errorMessage);
      throw error;
    }
  };

  const renderIcon = (platform: Platform) => {
    switch (platform) {
      case "instagram":
        return (
          <div className="w-8 h-8">
            <img src="/icons/platform/instagram.png" alt="Instagram" className="w-full h-full" /> 
          </div>
        );
      case "telegram":
        return (
          <div className="w-8 h-8">
            <img src="/icons/platform/telegram.png" alt="Telegram" className="w-full h-full" />
          </div>
        );
      case "line":
        return (
          <div className="w-8 h-8">
            <img src="/icons/platform/line.png" alt="Line" className="w-full h-full" />
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
    <div className="bg-card rounded-[14px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[24px] font-bold text-foreground leading-5">
          상담 채널 연동
        </h1>
        <div className="flex items-center px-3 py-1 bg-primary-10 rounded-[30px]">
          <span className="text-[12px] font-medium text-primary-80 opacity-80">
            연결된 채널 : {connectedCount}개
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-border opacity-50 mb-12"></div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
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
      {modalPlatform === "line" ? (
        <LineIntegrationModal
          isOpen={true}
          onClose={() => setModalPlatform(null)}
          onConfirm={async (data) => {
            await handleConfirmIntegration(data);
          }}
          projectId={projectId || ""}
        />
      ) : (
        modalPlatform && (
          <MessengerIntegrationModal
            isOpen={true}
            onClose={() => setModalPlatform(null)}
            onConfirm={handleConfirmIntegration}
            platform={modalPlatform}
          />
        )
      )}
    </div>
  );
}
