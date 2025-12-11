"use client";

import { useMemo, useEffect, useState } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import { hasAdminAccess, isAdmin } from "@/utils/permissions";
import type { MemberRole } from "@/types/members";

function SidebarSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-8 py-3">
          <div className="w-5 h-5 bg-neutral-20 rounded animate-pulse" />
          <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
        </div>
      ))}
    </>
  );
}
import GeneralIcon from "./icons/GeneralIcon";
import ProfileIcon from "./icons/ProfileIcon";
import ConsultationChannelIcon from "./icons/ConsultationChannelIcon";
import MemberIcon from "./icons/MemberIcon";
import InvitedMemberIcon from "./icons/InvitedMemberIcon";
import TeamIcon from "./icons/TeamIcon";
import OrganizationManagementIcon from "./icons/OrganizationManagementIcon";
import CustomerApiIcon from "./icons/CustomerApiIcon";
import BatchRegistrationIcon from "./icons/BatchRegistrationIcon";
import SenderNumberIcon from "./icons/SenderNumberIcon";
import SmsHistoryIcon from "./icons/SmsHistoryIcon";
import SmsIcon from "./icons/SmsIcon";

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
  key: SettingsTab | null; // null이면 부모 항목 (토글만)
  label: string;
  icon: React.ComponentType<{ isActive: boolean }>;
  /** 탭 접근 권한 체크 함수 - 반환값이 true면 표시 */
  canAccess?: (params: { role: MemberRole | undefined; isLoading: boolean }) => boolean;
  /** 하위 항목들 */
  children?: SidebarItem[];
  /** 부모 항목인지 (토글만 하고 페이지 이동 안 함) */
  isParent?: boolean;
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
    key: null,
    label: "조직관리",
    icon: OrganizationManagementIcon,
    isParent: true,
    // 조직관리는 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
    children: [
      {
        key: "team-management",
        label: "팀",
        icon: TeamIcon,
        // 팀은 모든 사용자 접근 가능 (본인 팀 확인용)
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
        key: "invited-member",
        label: "초대중인 멤버",
        icon: InvitedMemberIcon,
        // 초대중인 멤버는 admin 또는 subAdmin만 접근 가능
        canAccess: ({ role, isLoading }) => {
          if (isLoading) return false;
          return hasAdminAccess(role);
        },
      },
    ],
  },
  {
    key: null,
    label: "문자",
    icon: SmsIcon,
    isParent: true,
    // 문자는 admin 또는 subAdmin만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return hasAdminAccess(role);
    },
    children: [
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
        key: "sms-history",
        label: "문자 발송 이력",
        icon: SmsHistoryIcon,
        // 문자 발송 이력은 admin 또는 subAdmin만 접근 가능
        canAccess: ({ role, isLoading }) => {
          if (isLoading) return false;
          return hasAdminAccess(role);
        },
      },
    ],
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
    key: "customer-api",
    label: "고객등록 API",
    icon: CustomerApiIcon,
    // 고객등록 API는 admin 또는 subAdmin만 접근 가능
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
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set()); // 기본적으로 닫힘
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후에만 조건부 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 현재 활성 탭이 하위 항목인지 확인하고 부모를 확장
  useEffect(() => {
    const parentLabels = new Set<string>();
    SIDEBAR_ITEMS.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.key === activeTab);
        if (hasActiveChild) {
          parentLabels.add(item.label);
        }
      }
    });
    if (parentLabels.size > 0) {
      setExpandedParents((prev) => {
        const newSet = new Set(prev);
        parentLabels.forEach((label) => newSet.add(label));
        return newSet;
      });
    }
  }, [activeTab]);

  // 현재 사용자 권한에 따라 접근 가능한 탭만 필터링 (재귀적으로)
  const filterVisibleItems = (items: SidebarItem[]): SidebarItem[] => {
    return items
      .map((item) => {
        // canAccess가 없으면 모든 사용자 접근 가능
        const canAccess = !item.canAccess || item.canAccess({ role: currentRole, isLoading: loading });
        
        if (!canAccess) return null;

        // 하위 항목이 있으면 재귀적으로 필터링
        if (item.children) {
          const filteredChildren = filterVisibleItems(item.children);
          // 하위 항목이 하나도 없으면 부모도 숨김
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }

        return item;
      })
      .filter((item): item is SidebarItem => item !== null);
  };

  const visibleItems = useMemo(() => {
    return filterVisibleItems(SIDEBAR_ITEMS);
  }, [currentRole, loading]);

  // 부모 항목 토글
  const toggleParent = (label: string) => {
    setExpandedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  // 항목이 활성화되어 있는지 확인 (하위 항목 포함)
  const isItemActive = (item: SidebarItem): boolean => {
    if (item.key === activeTab) return true;
    if (item.children) {
      return item.children.some((child) => child.key === activeTab);
    }
    return false;
  };

  // 항목 렌더링 (재귀)
  const renderItem = (item: SidebarItem, level: number = 0) => {
    const IconComponent = item.icon;
    const isActive = isItemActive(item);
    const isExpanded = item.isParent && expandedParents.has(item.label);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (item.isParent) {
              toggleParent(item.label);
            } else if (item.key) {
              onTabChange(item.key);
            }
          }}
          className={`cursor-pointer w-full h-[52px] flex items-center gap-3 pr-8 text-left transition-colors ${
            level > 0 ? "pl-[60px]" : "pl-[30px]"
          } ${
            isActive
              ? "bg-primary-10/30 text-primary-80"
              : "text-neutral-70 hover:bg-neutral-10"
          }`}
        >
          <IconComponent isActive={isActive} />
          <span className="text-[16px] font-medium flex-1">{item.label}</span>
          {hasChildren && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke={isActive ? "#00E272" : "#B0B0B0"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="w-[280px] bg-card rounded-[14px] pt-7 pb-5 flex flex-col self-start">
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
        {!mounted || loading ? (
          <SidebarSkeleton />
        ) : (
          visibleItems.map((item) => renderItem(item))
        )}
      </nav>
    </div>
  );
}
