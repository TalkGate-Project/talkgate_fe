"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { hasAdminAccess, isAdmin } from "@/utils/permissions";
import type { MemberRole, MyMember } from "@/types/members";
import SettingsSidebar from "./SettingsSidebar";
import GeneralSettings from "./GeneralSettings";
import ProfileSettings from "./ProfileSettings";
import ConsultationChannelSettings from "./ConsultationChannelSettings";
import MemberSettings from "./MemberSettings";
import InvitedMemberSettings from "./InvitedMemberSettings";
import TeamManagementSettings from "./TeamManagementSettings";
import BatchRegistrationHistorySettings from "./BatchRegistrationHistorySettings";
import CustomerApiSettings from "./customer-api/CustomerApiSettings";
import SenderNumberSettings from "./SenderNumberSettings";
import SmsHistorySettings from "./SmsHistorySettings";

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

const TAB_COMPONENTS: Record<SettingsTab, React.ComponentType> = {
  general: GeneralSettings,
  profile: ProfileSettings,
  "consultation-channel": ConsultationChannelSettings,
  member: MemberSettings,
  "invited-member": InvitedMemberSettings,
  "customer-api": CustomerApiSettings,
  "team-management": TeamManagementSettings,
  "batch-registration": BatchRegistrationHistorySettings,
  "sender-numbers": SenderNumberSettings,
  "sms-history": SmsHistorySettings,
};

// 권한이 필요한 탭 목록 (admin/subAdmin만 접근 가능)
const ADMIN_ONLY_TABS: SettingsTab[] = [
  "consultation-channel",
  "member",
  "customer-api",
  "invited-member",
  "batch-registration",
  "sender-numbers",
  "sms-history",
];

// 유효한 탭인지 확인하는 함수
function isValidTab(tab: string | null): tab is SettingsTab {
  if (!tab) return false;
  return tab in TAB_COMPONENTS;
}

// 권한에 따른 기본 탭 반환
function getDefaultTab(role: MemberRole | undefined): SettingsTab {
  // admin만 general, 그 외는 profile
  return isAdmin(role) ? "general" : "profile";
}

// 해당 탭에 접근 가능한지 확인
function canAccessTab(tab: SettingsTab, member: MyMember | null | undefined): boolean {
  const role = member?.role;

  // 일반 탭은 **총관리자(admin)**만, my API 데이터가 없는 경우에도 차단
  if (tab === "general") {
    if (!member) return false;
    return isAdmin(role);
  }

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
  const [mounted, setMounted] = useState(false);
  
  // 권한에 따른 기본 탭
  const defaultTab = useMemo(() => getDefaultTab(currentRole), [currentRole]);
  
  // URL에서 탭 정보를 읽어옴
  const tabParam = searchParams.get("tab");
  const activeTab = isValidTab(tabParam) ? tabParam : defaultTab;

  // 클라이언트 마운트 후에만 조건부 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 권한 체크 후 잘못된 탭이면 기본 탭으로 리디렉션
  useEffect(() => {
    if (loading) return;
    
    // 유효하지 않은 탭이거나 권한이 없는 탭이면 기본 탭으로 리디렉션
    const shouldRedirect = 
      (tabParam && !isValidTab(tabParam)) || 
      (isValidTab(tabParam) && !canAccessTab(tabParam, member));
    
    if (shouldRedirect) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", defaultTab);
      router.replace(`/settings?${params.toString()}`);
    }
  }, [tabParam, searchParams, router, member, loading, defaultTab]);

  // 탭 변경 함수
  const handleTabChange = useCallback((tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/settings?${params.toString()}`);
  }, [router, searchParams]);

  // 서버와 클라이언트 초기 렌더링을 일치시키기 위해 첫 렌더링에서는 항상 실제 컨텐츠 구조를 유지
  // Suspense fallback이 이미 스켈레톤을 처리하므로 여기서는 클라이언트 마운트 후에만 로딩 상태 표시
  if (!mounted || loading) {
    return (
      <div className="flex gap-8">
        <div className="w-[280px] bg-card rounded-[14px] pt-7 pb-5 flex flex-col self-start">
          <div className="px-7 pb-7 mb-1 border-b border-neutral-30/40">
            <div className="h-5 w-32 bg-neutral-20 rounded mb-2 animate-pulse" />
            <div className="h-4 w-40 bg-neutral-20 rounded animate-pulse" />
          </div>
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-8 py-3">
                <div className="w-5 h-5 bg-neutral-20 rounded animate-pulse" />
                <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-card rounded-[14px] p-7">
          <div className="h-6 w-40 bg-neutral-20 rounded mb-4 animate-pulse" />
          <div className="h-40 bg-neutral-20 rounded animate-pulse" />
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
