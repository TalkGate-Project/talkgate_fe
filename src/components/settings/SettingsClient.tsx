"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { hasAdminAccess, isAdmin } from "@/utils/permissions";
import type { MemberRole, MyMember } from "@/types/members";
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
import PartnerRegistrationSettings from "./PartnerRegistrationSettings";

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
  | "sms-history"
  | "partner-registration";

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
  "partner-registration": PartnerRegistrationSettings,
};

// 권한이 필요한 탭 목록 (admin/subAdmin만 접근 가능)
const ADMIN_ONLY_TABS: SettingsTab[] = [
  "general",
  "customer-api",
  "partner-registration",
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

// 해당 탭에 접근 가능한지 확인 (파트너등록은 isDataProvider일 때만)
function canAccessTab(
  tab: SettingsTab,
  member: MyMember | null | undefined,
  isDataProvider: boolean
): boolean {
  const role = member?.role;

  // 일반 탭은 어드민/서브어드민 접근 가능
  if (tab === "general") {
    if (!member) return false;
    return hasAdminAccess(role);
  }

  // 고객등록 API 탭은 **총관리자(admin) 및 부관리자(subAdmin)** 접근 가능
  if (tab === "customer-api") {
    if (!member) return false;
    return hasAdminAccess(role);
  }

  // 파트너등록 탭은 데이터 제공자(isDataProvider === true)일 때만, 어드민/서브어드민 접근 가능
  if (tab === "partner-registration") {
    if (!member) return false;
    if (!isDataProvider) return false;
    return hasAdminAccess(role);
  }

  if (ADMIN_ONLY_TABS.includes(tab)) {
    return hasAdminAccess(role);
  }
  return true;
}

export default function SettingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { member, loading: memberLoading } = useMyMember();
  const [projectId, projectReady] = useSelectedProjectId();
  const { project, isLoading: projectLoading } = useCurrentProjectDetail();
  const currentRole = member?.role;
  const [mounted, setMounted] = useState(false);

  /**
   * 권한/리디렉션 판단 전에 모두 준비될 때까지 대기 (타이밍 이슈 방지).
   * - projectReady: 쿠키에서 projectId를 읽기 전에는 true가 아니므로 대기.
   * - projectId가 있을 때만 프로젝트 상세 로딩 대기 (없으면 쿼리 비활성화로 isLoading이 false라 기다리지 않음).
   */
  const settingsLoading =
    memberLoading || !projectReady || (projectId != null && projectLoading);

  const isDataProvider = project?.isDataProvider ?? false;
  
  // 권한에 따른 기본 탭
  const defaultTab = useMemo(() => getDefaultTab(currentRole), [currentRole]);
  
  // URL에서 탭 정보를 읽어옴
  const tabParam = searchParams.get("tab");
  const openInvite = searchParams.get("openInvite");
  const activeTab = isValidTab(tabParam) ? tabParam : defaultTab;

  // 클라이언트 마운트 후에만 조건부 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // openInvite 쿼리스트링이 있으면 member 탭으로 이동
  useEffect(() => {
    if (settingsLoading || !mounted) return;
    if (openInvite === "true" && activeTab !== "member") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "member");
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    }
  }, [openInvite, activeTab, settingsLoading, mounted, searchParams, router]);

  // 권한 및 isDataProvider 체크 후 잘못된 탭이면 기본 탭으로 리디렉션 (프로젝트 로딩 완료 후에만 실행)
  useEffect(() => {
    if (settingsLoading) return;

    // 유효하지 않은 탭이거나 권한이 없는 탭이면 기본 탭으로 리디렉션
    const shouldRedirect =
      (tabParam && !isValidTab(tabParam)) ||
      (isValidTab(tabParam) && !canAccessTab(tabParam, member, isDataProvider));

    if (shouldRedirect) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", defaultTab);
      router.replace(`/settings?${params.toString()}`);
    }
  }, [tabParam, searchParams, router, member, settingsLoading, defaultTab, isDataProvider]);

  // 탭 변경 함수
  const handleTabChange = useCallback((tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/settings?${params.toString()}`);
  }, [router, searchParams]);

  // 권한 확정 전에는 설정 컨텐츠를 노출하지 않고 스피너만 표시
  if (!mounted || settingsLoading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" aria-label="설정 로딩 중" />
      </div>
    );
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex gap-8">
      {/* 사이드바 - 모바일에서 숨김 */}
      <div className="hidden md:block">
        <SettingsSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />
      </div>
      
      {/* 메인 컨텐츠: 780~1079 구간에서 우측 컨테이너 가로 스크롤 허용 */}
      <div className="flex-1 w-full md:w-auto min-w-0 md:overflow-x-auto lg:overflow-x-visible">
        <div className="md:min-w-max lg:min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
