"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import SettingsSidebar from "./SettingsSidebar";
import GeneralSettings from "./GeneralSettings";
import ProfileSettings from "./ProfileSettings";
import ConsultationChannelSettings from "./ConsultationChannelSettings";
import MemberSettings from "./MemberSettings";
import InvitedMemberSettings from "./InvitedMemberSettings";
import TeamManagementSettings from "./TeamManagementSettings";
import BatchRegistrationHistorySettings from "./BatchRegistrationHistorySettings";

type SettingsTab = "general" | "profile" | "consultation-channel" | "member" | "invited-member" | "team-management" | "batch-registration";

const TAB_COMPONENTS = {
  general: GeneralSettings,
  profile: ProfileSettings,
  "consultation-channel": ConsultationChannelSettings,
  member: MemberSettings,
  "invited-member": InvitedMemberSettings,
  "team-management": TeamManagementSettings,
  "batch-registration": BatchRegistrationHistorySettings,
};

const DEFAULT_TAB: SettingsTab = "general";

export default function SettingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 탭 정보를 읽어옴
  const activeTab = (searchParams.get("tab") as SettingsTab) || DEFAULT_TAB;

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
