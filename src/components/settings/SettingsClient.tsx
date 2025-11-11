"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
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

const TAB_COMPONENTS = {
  general: GeneralSettings,
  profile: ProfileSettings,
  "consultation-channel": ConsultationChannelSettings,
  member: MemberSettings,
  "invited-member": InvitedMemberSettings,
  "customer-api": CustomerApiSettings,
  "team-management": TeamManagementSettings,
  "batch-registration": BatchRegistrationHistorySettings,
};

const DEFAULT_TAB: SettingsTab = "general";

// 유효한 탭인지 확인하는 함수
function isValidTab(tab: string | null): tab is SettingsTab {
  if (!tab) return false;
  return tab in TAB_COMPONENTS;
}

export default function SettingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 탭 정보를 읽어옴
  const tabParam = searchParams.get("tab");
  const activeTab = isValidTab(tabParam) ? tabParam : DEFAULT_TAB;

  // 유효하지 않은 탭이면 기본 탭으로 리디렉션
  useEffect(() => {
    if (tabParam && !isValidTab(tabParam)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", DEFAULT_TAB);
      router.replace(`/settings?${params.toString()}`);
    }
  }, [tabParam, searchParams, router]);

  // 탭 변경 함수
  const handleTabChange = useCallback((tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/settings?${params.toString()}`);
  }, [router, searchParams]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex gap-6">
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
