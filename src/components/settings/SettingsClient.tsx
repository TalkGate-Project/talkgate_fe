"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { hasAdminAccess } from "@/utils/permissions";
import type { MemberRole } from "@/types/members";
import SettingsSidebar from "./SettingsSidebar";
import GeneralSettings from "./GeneralSettings";
import ProfileSettings from "./ProfileSettings";
import ConsultationChannelSettings from "./ConsultationChannelSettings";
import MemberSettings from "./MemberSettings";
import InvitedMemberSettings from "./InvitedMemberSettings";
import TeamManagementSettings from "./TeamManagementSettings";
import BatchRegistrationHistorySettings from "./BatchRegistrationHistorySettings";
import CustomerApiSettings from "./customer-api/CustomerApiSettings";

type SettingsTab =
  | "general"
  | "profile"
  | "consultation-channel"
  | "member"
  | "invited-member"
  | "customer-api"
  | "team-management"
  | "batch-registration";

const TAB_COMPONENTS: Record<SettingsTab, React.ComponentType> = {
  general: GeneralSettings,
  profile: ProfileSettings,
  "consultation-channel": ConsultationChannelSettings,
  member: MemberSettings,
  "invited-member": InvitedMemberSettings,
  "customer-api": CustomerApiSettings,
  "team-management": TeamManagementSettings,
  "batch-registration": BatchRegistrationHistorySettings,
};

// 권한이 필요한 탭 목록 (admin/subAdmin만 접근 가능)
const ADMIN_ONLY_TABS: SettingsTab[] = [
  "general",
  "consultation-channel",
  "member",
  "customer-api",
  "invited-member",
  "batch-registration",
];

// 유효한 탭인지 확인하는 함수
function isValidTab(tab: string | null): tab is SettingsTab {
  if (!tab) return false;
  return tab in TAB_COMPONENTS;
}

// 권한에 따른 기본 탭 반환
function getDefaultTab(role: MemberRole | undefined): SettingsTab {
  // admin/subAdmin은 general, 그 외는 profile
  return hasAdminAccess(role) ? "general" : "profile";
}

// 해당 탭에 접근 가능한지 확인
function canAccessTab(tab: SettingsTab, role: MemberRole | undefined): boolean {
  if (ADMIN_ONLY_TABS.includes(tab)) {
    return hasAdminAccess(role);
  }
  return true;
}

export default function SettingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { member, loading } = useMyMember();
  const currentRole = member?.role;
  
  // 권한에 따른 기본 탭
  const defaultTab = useMemo(() => getDefaultTab(currentRole), [currentRole]);
  
  // URL에서 탭 정보를 읽어옴
  const tabParam = searchParams.get("tab");
  const activeTab = isValidTab(tabParam) ? tabParam : defaultTab;

  // 권한 체크 후 잘못된 탭이면 기본 탭으로 리디렉션
  useEffect(() => {
    if (loading) return;
    
    // 유효하지 않은 탭이거나 권한이 없는 탭이면 기본 탭으로 리디렉션
    const shouldRedirect = 
      (tabParam && !isValidTab(tabParam)) || 
      (isValidTab(tabParam) && !canAccessTab(tabParam, currentRole));
    
    if (shouldRedirect) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", defaultTab);
      router.replace(`/settings?${params.toString()}`);
    }
  }, [tabParam, searchParams, router, currentRole, loading, defaultTab]);

  // 탭 변경 함수
  const handleTabChange = useCallback((tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/settings?${params.toString()}`);
  }, [router, searchParams]);

  // 로딩 중이면 스켈레톤 표시
  if (loading) {
    return (
      <div className="flex gap-8">
        <div className="w-[280px] max-h-[530px] bg-card rounded-[14px] pt-7 pb-5 animate-pulse">
          <div className="px-7 pb-7 mb-1">
            <div className="h-5 w-32 bg-neutral-20 rounded mb-2" />
            <div className="h-4 w-40 bg-neutral-20 rounded" />
          </div>
        </div>
        <div className="flex-1 bg-card rounded-[14px] p-7 animate-pulse">
          <div className="h-6 w-40 bg-neutral-20 rounded mb-4" />
          <div className="h-40 bg-neutral-20 rounded" />
        </div>
      </div>
    );
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex gap-8">
      {/* 사이드바 */}
      <SettingsSidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
      
      {/* 메인 컨텐츠 */}
      <div className="flex-1">
        <ActiveComponent />
      </div>
    </div>
  );
}
