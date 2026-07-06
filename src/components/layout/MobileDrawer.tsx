"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useMe } from "@/hooks/useMe";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import { useMyMember } from "@/hooks/useMyMember";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import { isAdmin } from "@/utils/permissions";
import { requestNotificationPermissionWithGuide } from "@/utils/notification";

// 아이콘 컴포넌트들
import {
  DashboardIcon,
  ConsultIcon,
  CustomerListIcon,
  StatsIcon,
  AttendanceIcon,
  NoticeIcon,
  SettingsIcon,
  CloseIcon,
} from "@/components/icons";

// MySettings 아이콘들
import ProfileIcon from "@/components/my-settings/icons/ProfileIcon";
import NotificationIcon from "@/components/my-settings/icons/NotificationIcon";
import BillingIcon from "@/components/my-settings/icons/BillingIcon";
import SecurityIcon from "@/components/my-settings/icons/SecurityIcon";

// Settings 상수 및 타입
import { SETTINGS_ITEMS, type SettingsTab, type SettingsSidebarItem } from "@/components/settings/constants";
import { DOCUMENTATION_URL } from "@/lib/constants";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

type MySettingsTab = "profile" | "notification" | "billing" | "security";

export default function MobileDrawer({ isOpen, onClose, isDarkMode, onToggleTheme }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useMe();
  const [showAttendanceMenu, attendanceReady] = useAttendanceMenu();
  const { member, loading: memberLoading } = useMyMember();
  const [mounted, setMounted] = useState(false);
  const [projectId] = useSelectedProjectId();
  const [projectLogoUrl, setProjectLogoUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("-");
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

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
          setProjectName(project.name || "-");
        }
      } catch (error) {
        console.error("Failed to fetch project info:", error);
      }
    };
    
    fetchProjectInfo();
  }, [projectId]);

  // MySettings 메뉴 아이템
  const MY_SETTINGS_ITEMS: Array<{ key: MySettingsTab; label: string; icon: React.ComponentType<{ isActive: boolean }> }> = [
    { key: "profile", label: "프로필", icon: ProfileIcon },
    { key: "notification", label: "알림", icon: NotificationIcon },
    { key: "billing", label: "구독관리", icon: BillingIcon },
    { key: "security", label: "보안", icon: SecurityIcon },
  ];

  // Settings 메뉴 필터링
  const visibleSettingsItems = useMemo(() => {
    const filterVisibleItems = (items: SettingsSidebarItem[]): SettingsSidebarItem[] => {
      return items
        .map((item) => {
          const canAccess = !item.canAccess || item.canAccess({ role: member?.role, isLoading: memberLoading });
          
          if (!canAccess) return null;

          if (item.children) {
            const filteredChildren = filterVisibleItems(item.children);
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }

          return item;
        })
        .filter((item): item is SettingsSidebarItem => item !== null);
    };

    return filterVisibleItems(SETTINGS_ITEMS);
  }, [member?.role, memberLoading]);

  // 현재 활성 탭 확인
  const currentMySettingsTab = useMemo(() => {
    if (pathname !== "/my-settings") return null;
    const tabParam = searchParams.get("tab");
    const validTabs: MySettingsTab[] = ["profile", "notification", "billing", "security"];
    return validTabs.includes(tabParam as MySettingsTab) ? (tabParam as MySettingsTab) : "profile";
  }, [pathname, searchParams]);

  const currentSettingsTab = useMemo(() => {
    if (pathname !== "/settings") return null;
    const tabParam = searchParams.get("tab");
    const validTabs: SettingsTab[] = [
      "general", "profile", "consultation-channel", "sender-numbers",
      "member", "invited-member", "customer-api", "team-management",
      "batch-registration", "sms-history"
    ];
    return validTabs.includes(tabParam as SettingsTab) ? (tabParam as SettingsTab) : (isAdmin(member?.role) ? "general" : "profile");
  }, [pathname, searchParams, member?.role]);

  // MySettings 탭 변경 핸들러
  const handleMySettingsTabChange = useCallback((tab: MySettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/my-settings?${params.toString()}`);
    onClose();
  }, [router, searchParams, onClose]);

  // Settings 탭 변경 핸들러
  const handleSettingsTabChange = useCallback((tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/settings?${params.toString()}`);
    onClose();
  }, [router, searchParams, onClose]);

  // Settings 부모 항목 토글
  const toggleSettingsParent = useCallback((label: string) => {
    setExpandedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }, []);

  // Settings 항목이 활성화되어 있는지 확인
  const isSettingsItemActive = useCallback((item: SettingsSidebarItem): boolean => {
    if (!currentSettingsTab) return false;
    if (item.key === currentSettingsTab) return true;
    if (item.children) {
      return item.children.some((child) => child.key === currentSettingsTab);
    }
    return false;
  }, [currentSettingsTab]);

  // 현재 활성 탭이 하위 항목인지 확인하고 부모를 확장
  useEffect(() => {
    if (pathname !== "/settings" || !currentSettingsTab) return;
    
    const parentLabels = new Set<string>();
    // SETTINGS_ITEMS는 상수이므로 dependency에 포함할 필요 없음
    for (const item of SETTINGS_ITEMS) {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.key === currentSettingsTab);
        if (hasActiveChild) {
          parentLabels.add(item.label);
        }
      }
    }
    if (parentLabels.size > 0) {
      setExpandedParents((prev) => {
        const newSet = new Set(prev);
        parentLabels.forEach((label) => newSet.add(label));
        return newSet;
      });
    }
  }, [currentSettingsTab, pathname]);

  const MENU_ITEMS = [
    { label: "대시보드", href: "/dashboard", icon: <DashboardIcon /> },
    { label: "상담", href: "/consult", icon: <ConsultIcon /> },
    { label: "고객목록", href: "/customers", icon: <CustomerListIcon /> },
    { label: "통계", href: "/stats", icon: <StatsIcon /> },
    // 프로젝트가 근태 메뉴를 사용하는 경우에만 표시
    // 백엔드에서 권한 기반 필터링을 처리하므로 프론트엔드에서는 권한 체크 불필요
    ...(attendanceReady && showAttendanceMenu 
      ? [{ label: "근태", href: "/attendance", icon: <AttendanceIcon /> }] 
      : []),
    { label: "공지사항", href: "/notices", icon: <NoticeIcon /> },
    { label: "설정", href: "/settings", icon: <SettingsIcon /> },
  ];


  // Settings 메뉴 렌더링 (재귀)
  const renderSettingsItem = (item: SettingsSidebarItem, level: number = 0) => {
    const IconComponent = item.icon;
    const isActive = isSettingsItemActive(item);
    const isExpanded = item.isParent && expandedParents.has(item.label);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (item.isParent) {
              toggleSettingsParent(item.label);
            } else if (item.key) {
              handleSettingsTabChange(item.key);
            }
          }}
          className={`cursor-pointer w-full h-[52px] flex items-center gap-3 pr-8 text-left transition-colors rounded-[4px] ${
            level > 0 ? "pl-[60px]" : "pl-5"
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
            {item.children!.map((child) => renderSettingsItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[60]"
            style={{ zoom: 1 }}
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-[54px] left-0 bottom-0 w-[336px] bg-neutral-0 dark:bg-neutral-10 z-[61] rounded-tr-[12px] shadow-lg overflow-y-auto"
            style={{ zoom: 1 }}
          >
            {/* Header Area inside Drawer */}
            <div className={pathname === "/settings" || (pathname !== "/my-settings" && pathname !== "/settings") ? "pt-7 pb-4" : "p-[23px] pb-4"}>
              <div className={`flex justify-between items-start ${
                pathname === "/settings" || (pathname !== "/my-settings" && pathname !== "/settings") 
                  ? "px-7 pb-7 mb-1" 
                  : "mb-6"
              }`}>
                {/* Header Content */}
                {pathname === "/my-settings" ? (
                  <div className="flex-1">
                    <h2 className="text-[18px] font-bold text-foreground mb-1">개인 설정</h2>
                    <p className="text-[14px] text-neutral-60">{projectName}</p>
                  </div>
                ) : pathname === "/settings" ? (
                  <div className="flex-1">
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
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {/* 라이트 모드 로고 */}
                      <Image 
                        src="/main_logo_dark.webp" 
                        alt="Talkgate" 
                        width={102} 
                        height={24} 
                        className="h-6 w-auto dark:hidden" 
                      />
                      {/* 다크 모드 로고 */}
                      <Image 
                        src="/main_logo.webp" 
                        alt="Talkgate" 
                        width={102} 
                        height={24} 
                        className="h-6 w-auto hidden dark:block" 
                      />
                    </div>
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
                )}
                 
                <button onClick={onClose} className="p-1 text-neutral-90 dark:text-neutral-70 flex-shrink-0">
                  <CloseIcon />
                </button>
              </div>

              {/* Menu Items - 페이지에 따라 다른 메뉴 표시 */}
              {pathname === "/my-settings" ? (
                <nav className="flex flex-col gap-1 -mx-[23px]">
                  {MY_SETTINGS_ITEMS.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = currentMySettingsTab === item.key;
                    
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleMySettingsTabChange(item.key)}
                        className={`cursor-pointer w-full flex items-center gap-3 py-3 text-left transition-colors rounded-[4px] ${
                          isActive
                            ? "bg-primary-10/30 text-primary-60 px-[23px]"
                            : "text-neutral-70 hover:bg-neutral-10 px-[23px]"
                        }`}
                      >
                        <IconComponent isActive={isActive} />
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              ) : pathname === "/settings" ? (
                <nav className="flex flex-col gap-1">
                  {!mounted || memberLoading ? (
                    <>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                          <div className="w-5 h-5 bg-neutral-20 rounded animate-pulse" />
                          <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
                        </div>
                      ))}
                    </>
                  ) : (
                    visibleSettingsItems.map((item) => renderSettingsItem(item))
                  )}
                </nav>
              ) : (
                <nav className="flex flex-col gap-1">
                  {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          // 상담(채팅) 화면으로 이동하는 클릭은 실제 사용자 제스처이므로
                          // 여기서 알림 권한을 요청해야 Edge 등에서 조용히 무시되는 문제를 피할 수 있음
                          if (item.href === "/consult") {
                            requestNotificationPermissionWithGuide();
                          }
                          onClose();
                        }}
                        className={`flex items-center gap-4 px-5 py-3 rounded-[4px] transition-colors ${
                          isActive 
                            ? "bg-primary-10/30 dark:bg-primary-10/10 text-primary-60" 
                            : "text-neutral-60 dark:text-neutral-50 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                        }`}
                      >
                        <div className={`${isActive ? "text-primary-60" : "text-neutral-50 dark:text-neutral-50"}`}>
                          {item.icon}
                        </div>
                        <span className={`text-[16px] font-medium ${isActive ? "font-bold text-primary-60" : "text-neutral-60 dark:text-neutral-60"}`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
