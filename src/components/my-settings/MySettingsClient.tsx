"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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

export default function MySettingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 탭 정보를 읽어옴
  const activeTab = (searchParams.get("tab") as MySettingsTab) || DEFAULT_TAB;

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

