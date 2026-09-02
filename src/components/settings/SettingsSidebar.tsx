"use client";

import { useMemo, useEffect, useState } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { SETTINGS_ITEMS, type SettingsTab, type SettingsSidebarItem } from "./constants";

function SidebarSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex h-[52px] items-center justify-center lg:justify-start lg:gap-3 lg:px-8">
          <div className="h-6 w-6 animate-pulse rounded bg-neutral-20 lg:h-5 lg:w-5" />
          <div className="hidden h-4 w-20 animate-pulse rounded bg-neutral-20 lg:block" />
        </div>
      ))}
    </>
  );
}

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const { member, loading } = useMyMember();
  const currentRole = member?.role;
  const { project } = useCurrentProjectDetail();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set()); // 기본적으로 닫힘
  const [mounted, setMounted] = useState(false);

  const projectLogoUrl = project?.logoUrl ?? null;
  const projectName = project?.name ?? "-";

  // 클라이언트 마운트 후에만 조건부 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 현재 활성 탭이 하위 항목인지 확인하고 부모를 확장
  useEffect(() => {
    const parentLabels = new Set<string>();
    SETTINGS_ITEMS.forEach((item) => {
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

  // 현재 사용자 권한 및 프로젝트(isDataProvider)에 따라 접근 가능한 탭만 필터링 (재귀적으로)
  const visibleItems = useMemo(() => {
    const isDataProvider = project?.isDataProvider ?? false;
    const filterVisibleItems = (items: SettingsSidebarItem[]): SettingsSidebarItem[] => {
      return items
        .map((item) => {
          // canAccess가 없으면 모든 사용자 접근 가능
          const canAccess = !item.canAccess || item.canAccess({ role: currentRole, isLoading: loading, isDataProvider });
          
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
        .filter((item): item is SettingsSidebarItem => item !== null);
    };

    return filterVisibleItems(SETTINGS_ITEMS);
  }, [currentRole, loading, project?.isDataProvider]);

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
  const isItemActive = (item: SettingsSidebarItem): boolean => {
    if (item.key === activeTab) return true;
    if (item.children) {
      return item.children.some((child) => child.key === activeTab);
    }
    return false;
  };

  // 항목 렌더링 (재귀)
  const renderItem = (item: SettingsSidebarItem, level: number = 0) => {
    const IconComponent = item.icon;
    const isActive = isItemActive(item);
    const isExpanded = item.isParent && expandedParents.has(item.label);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.label} className="group/settings-item relative">
        <button
          type="button"
          aria-label={item.label}
          aria-expanded={hasChildren ? isExpanded : undefined}
          title={item.label}
          onClick={() => {
            if (item.isParent) {
              toggleParent(item.label);
            } else if (item.key) {
              onTabChange(item.key);
            }
          }}
          style={item.offsetLeft != null ? { transform: `translateX(${item.offsetLeft}px)` } : undefined}
          className={`flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[12px] text-left transition-colors lg:justify-start lg:gap-3 lg:rounded-none lg:pr-8 ${
            level > 0 ? "lg:pl-[60px]" : "lg:pl-[30px]"
          } ${
            isActive
              ? "bg-primary-10/30 text-primary-80"
              : "text-neutral-70 hover:bg-neutral-10"
          }`}
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center [&>svg]:h-6 [&>svg]:w-6 lg:h-5 lg:w-5 lg:[&>svg]:h-5 lg:[&>svg]:w-5">
            <IconComponent isActive={isActive} />
          </span>
          <span className="hidden flex-1 text-[16px] font-medium lg:block">{item.label}</span>
          {hasChildren && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`hidden transition-transform lg:block ${isExpanded ? "rotate-180" : ""}`}
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
        {hasChildren && (
          <>
            <div className="absolute left-full top-0 z-30 ml-2 hidden w-[180px] rounded-[10px] border border-neutral-30 bg-card p-1 shadow-lg group-hover/settings-item:block group-focus-within/settings-item:block lg:hidden">
              {item.children!.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = child.key === activeTab;

                return (
                  <button
                    key={child.label}
                    type="button"
                    onClick={() => child.key && onTabChange(child.key)}
                    className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-[7px] px-3 text-left transition-colors ${
                      isChildActive
                        ? "bg-primary-10/30 text-primary-80"
                        : "text-neutral-70 hover:bg-neutral-10"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                      <ChildIcon isActive={isChildActive} />
                    </span>
                    <span className="text-[14px] font-medium">{child.label}</span>
                  </button>
                );
              })}
            </div>
            {isExpanded && (
              <div className="hidden lg:block">
                {item.children!.map((child) => renderItem(child, level + 1))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  return (
    <aside className="flex min-h-[552px] w-20 flex-col self-start rounded-[14px] bg-card px-3 pb-4 lg:min-h-0 lg:w-[280px] lg:px-0 lg:pb-5 lg:pt-7">
      {/* 헤더 */}
      <div className="mb-2 flex h-[76px] flex-shrink-0 items-center justify-center border-b border-neutral-30/40 dark:!border-[#44444455] lg:mb-1 lg:block lg:h-auto lg:px-7 lg:pb-7">
        <h2 className="mb-2 hidden text-[18px] font-bold leading-none text-foreground lg:block">프로젝트 설정</h2>
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          {projectLogoUrl ? (
            <img
              src={projectLogoUrl}
              alt={`${projectName} 로고`}
              width={28}
              height={28}
              className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-neutral-20 dark:bg-neutral-20 flex-shrink-0" />
          )}
          <p className="hidden text-[14px] text-neutral-60 lg:block">{projectName}</p>
        </div>
      </div>

      {/* 탭 목록 */}
      <nav aria-label="프로젝트 설정" className="space-y-1">
        {!mounted || loading ? (
          <SidebarSkeleton />
        ) : (
          visibleItems.map((item) => renderItem(item))
        )}
      </nav>
    </aside>
  );
}
