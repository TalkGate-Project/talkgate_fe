"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import MySettingsSidebar from "./MySettingsSidebar";
import ProfileTab from "./ProfileTab";
import NotificationTab from "./NotificationTab";
import SecurityTab from "./SecurityTab";

type MySettingsTab = "profile" | "notification" | "security";

const TAB_COMPONENTS = {
  profile: ProfileTab,
  notification: NotificationTab,
  security: SecurityTab,
};

const DEFAULT_TAB: MySettingsTab = "profile";

// 유효한 탭인지 확인하는 함수
function isValidTab(tab: string | null): tab is MySettingsTab {
  if (!tab) return false;
  return tab in TAB_COMPONENTS;
}

export default function MySettingsClient() {
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
      router.replace(`/my-settings?${params.toString()}`);
    }
  }, [tabParam, searchParams, router]);

  // 탭 변경 함수
  const handleTabChange = useCallback((tab: MySettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/my-settings?${params.toString()}`);
  }, [router, searchParams]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex gap-6">
      {/* 사이드바 */}
      <MySettingsSidebar 
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

