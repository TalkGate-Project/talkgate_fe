"use client";

import { useMemo, useEffect, useState } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import { hasAdminAccess, isAdmin } from "@/utils/permissions";
import type { MemberRole } from "@/types/members";
import GeneralIcon from "./icons/GeneralIcon";
import ProfileIcon from "./icons/ProfileIcon";
import ConsultationChannelIcon from "./icons/ConsultationChannelIcon";
import MemberIcon from "./icons/MemberIcon";
import InvitedMemberIcon from "./icons/InvitedMemberIcon";
import TeamManagementIcon from "./icons/TeamManagementIcon";
import CustomerApiIcon from "./icons/CustomerApiIcon";
import BatchRegistrationIcon from "./icons/BatchRegistrationIcon";
import SenderNumberIcon from "./icons/SenderNumberIcon";
import SmsHistoryIcon from "./icons/SmsHistoryIcon";

type SettingsTab =
  | "general"
  | "profile"
  | "consultation-channel"
  | "sender-numbers"
  | "member"
  | "invited-member"
  | "customer-api"
  | "team-management"
  | "batch-registration"
  | "sms-history";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

type SidebarItem = {
  key: SettingsTab;
  label: string;
  icon: React.ComponentType<{ isActive: boolean }>;
  /** 탭 접근 권한 체크 함수 - 반환값이 true면 표시 */
  canAccess?: (params: { role: MemberRole | undefined; isLoading: boolean }) => boolean;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    key: "general",
    label: "일반",
    icon: GeneralIcon,
    // 일반 탭은 **총관리자(admin)**만, my API 데이터 기준으로 엄격하게 제한
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return isAdmin(role);
    },
  },
  {
    key: "profile",
    label: "프로필",
    icon: ProfileIcon,
    // 프로필은 모든 사용자 접근 가능
  },
  {
    key: "consultation-channel",
    label: "상담채널",
    icon: ConsultationChannelIcon,
    // 상담채널은 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
  {
    key: "sender-numbers",
    label: "발신번호 등록",
    icon: SenderNumberIcon,
    // 발신번호 등록은 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
  {
    key: "member",
    label: "멤버",
    icon: MemberIcon,
    // 멤버 관리는 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
  {
    key: "customer-api",
    label: "고객등록 API",
    icon: CustomerApiIcon,
    // 고객등록 API는 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
  {
    key: "invited-member",
    label: "초대중인 멤버",
    icon: InvitedMemberIcon,
    // 초대중인 멤버는 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
  {
    key: "team-management",
    label: "팀관리",
    icon: TeamManagementIcon,
    // 팀관리는 모든 사용자 접근 가능 (본인 팀 확인용)
  },
  {
    key: "batch-registration",
    label: "일괄 등록 이력",
    icon: BatchRegistrationIcon,
    // 일괄 등록 이력은 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
  {
    key: "sms-history",
    label: "문자 발송 이력",
    icon: SmsHistoryIcon,
    // 문자 발송 이력은 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
  },
];

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const { member, loading } = useMyMember();
  const currentRole = member?.role;
  const [projectId] = useSelectedProjectId();
  const [projectLogoUrl, setProjectLogoUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("거래소 텔레마케팅 관리");

  // 프로젝트 정보 로드
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!projectId) return;
      
      try {
        const projectResponse = await ProjectsService.detailById({
          "x-project-id": projectId,
        });
        
        if (projectResponse.data?.data) {
          const project = projectResponse.data.data;
          setProjectLogoUrl(project.logoUrl || null);
          setProjectName(project.name || "거래소 텔레마케팅 관리");
        }
      } catch (error) {
        console.error("Failed to fetch project info:", error);
      }
    };
    
    fetchProjectInfo();
  }, [projectId]);

  // 현재 사용자 권한에 따라 접근 가능한 탭만 필터링
  const visibleItems = useMemo(() => {
    return SIDEBAR_ITEMS.filter((item) => {
      // canAccess가 없으면 모든 사용자 접근 가능
      if (!item.canAccess) return true;
      // 각 항목별로 로딩/역할 정보를 기준으로 접근 가능 여부 판단
      return item.canAccess({ role: currentRole, isLoading: loading });
    });
  }, [currentRole, loading]);
  return (
    <div className="w-[280px] max-h-[698px] bg-card rounded-[14px] pt-7 pb-5">
      {/* 헤더 */}
      <div className="px-7 pb-7 mb-1 border-b border-neutral-30/40">
        <h2 className="text-[18px] font-bold text-foreground mb-2 leading-[1]">프로젝트 설정</h2>
        <div className="flex items-center gap-3">
          {projectLogoUrl ? (
            <img
              src={projectLogoUrl}
              alt={`${projectName} 로고`}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-neutral-20 dark:bg-neutral-20 flex-shrink-0" />
          )}
          <p className="text-[14px] text-neutral-60">{projectName}</p>
        </div>
      </div>

      {/* 탭 목록 */}
      <nav className="space-y-1">
        {loading ? (
          // 로딩 중 스켈레톤
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-8 py-3">
              <div className="w-5 h-5 bg-neutral-20 rounded animate-pulse" />
              <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
            </div>
          ))
        ) : (
          visibleItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`cursor-pointer w-full h-[52px] flex items-center gap-3 px-8 text-left transition-colors ${
                  isActive
                    ? "bg-primary-10/30 text-primary-80"
                    : "text-neutral-70 hover:bg-neutral-10"
                }`}
              >
                <IconComponent isActive={isActive} />
                <span className="text-[16px] font-medium">{item.label}</span>
              </button>
            );
          })
        )}
      </nav>
    </div>
  );
}
