"use client";

import { useEffect, useState } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import ProfileIcon from "./icons/ProfileIcon";
import NotificationIcon from "./icons/NotificationIcon";
import BillingIcon from "./icons/BillingIcon";
import SecurityIcon from "./icons/SecurityIcon";

type MySettingsTab = "profile" | "notification" | "billing" | "security";

interface MySettingsSidebarProps {
  activeTab: MySettingsTab;
  onTabChange: (tab: MySettingsTab) => void;
}

// 모든 사용자가 모든 탭에 접근 가능 (정책 변경: 2025년)
// 프로필, 알림, 구독관리, 보안 탭 모두 모든 역할의 사용자에게 표시됨
const SIDEBAR_ITEMS = [
  {
    key: "profile" as const,
    label: "프로필",
    icon: ProfileIcon,
  },
  {
    key: "notification" as const,
    label: "알림",
    icon: NotificationIcon,
  },
  {
    key: "billing" as const,
    label: "구독관리",
    icon: BillingIcon,
  },
  {
    key: "security" as const,
    label: "보안",
    icon: SecurityIcon,
  },
];

export default function MySettingsSidebar({ activeTab, onTabChange }: MySettingsSidebarProps) {
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

  return (
    <div className="w-[280px] max-h-[362px] bg-card rounded-[14px] pt-7 pb-5 flex flex-col self-start">
      {/* 헤더 */}
      <div className="px-7 pb-5 border-b border-neutral-30/40 dark:!border-[#44444455]">
        <h2 className="text-[18px] font-bold text-foreground mb-2 leading-[1]">개인 설정</h2>
      </div>

      {/* 탭 목록 - 모든 사용자에게 모든 탭 표시 */}
      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`cursor-pointer w-full flex items-center gap-3 px-[30px] py-[14px] text-left transition-colors ${
                isActive
                  ? "bg-primary-10/30 text-primary-60"
                  : "text-neutral-70 hover:bg-neutral-10"
              }`}
            >
              <IconComponent isActive={isActive} />
              <span className="text-[14px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

