"use client";

import { useMemo, useEffect, useState } from "react";
import { useMyMember } from "@/hooks/useMyMember";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { SETTINGS_ITEMS, type SettingsTab, type SettingsSidebarItem } from "./constants";

function SidebarSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-8 py-3">
          <div className="w-5 h-5 bg-neutral-20 rounded animate-pulse" />
          <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
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
  const projectName = project?.name ?? "거래소 텔레마케팅 관리";

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
      <div key={item.label}>
        <button
          onClick={() => {
            if (item.isParent) {
              toggleParent(item.label);
            } else if (item.key) {
              onTabChange(item.key);
            }
          }}
          style={item.offsetLeft != null ? { transform: `translateX(${item.offsetLeft}px)` } : undefined}
          className={`cursor-pointer w-full h-[52px] flex items-center gap-3 pr-8 text-left transition-colors ${
            level > 0 ? "pl-[60px]" : "pl-[30px]"
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
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="w-[280px] bg-card rounded-[14px] pt-7 pb-5 flex flex-col self-start">
      {/* 헤더 */}
      <div className="px-7 pb-7 mb-1 border-b border-neutral-30/40 dark:!border-[#44444455]">
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

      {/* 탭 목록 */}
      <nav className="space-y-1">
        {!mounted || loading ? (
          <SidebarSkeleton />
        ) : (
          visibleItems.map((item) => renderItem(item))
        )}
      </nav>
    </div>
  );
}
