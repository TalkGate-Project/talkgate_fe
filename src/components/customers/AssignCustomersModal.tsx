"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BaseModal from "@/components/common/BaseModal";
import { useMe } from "@/hooks/useMe";
import { useMembersTree, useTeams } from "@/hooks/useMembersTree";
import { MemberTreeNode } from "@/types/membersTree";
import { TeamMember } from "@/types/teams";
import { flattenTeamData } from "@/hooks/useTeamTree";
import { HIERARCHY_LIST_TOKENS, getIndent, getConnectorLeft } from "@/components/settings/teamManagement/tokens";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export type AssignCustomersModalProps = {
  open: boolean;
  onClose: () => void;
  selectedCustomerIds: number[];
  selectionMode?: "page" | "all" | null;
  totalCount?: number;
  onAssign: (targetMemberId: number) => Promise<void>;
  projectId: string;
};

const ROLE_LABEL: Record<string, string> = {
  leader: "리더",
  member: "팀원",
};

function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed.charAt(0);
}

function transformMembers(
  nodes: MemberTreeNode[] | undefined,
  teamNameByLeader: Map<number, string>,
  parentId?: string,
  level: number = 0
): TeamMember[] {
  if (!nodes) return [];
  return nodes.map((node) => {
    const id = String(node.id);
    const teamName = teamNameByLeader.get(node.id) ?? "";
    const department = teamName || ROLE_LABEL[node.role] || node.role;
    const isLeader = teamNameByLeader.has(node.id) || node.role === "leader";
    const children = transformMembers(node.descendants, teamNameByLeader, id, level + 1);
    return {
      id,
      name: node.name,
      avatar: initialFromName(node.name),
      role: department,
      department,
      isLeader,
      level,
      parentId,
      children,
      isExpanded: true,
    };
  });
}

// 매칭되는 노드와 그 자손들의 ID를 수집
function collectMatchingAndDescendants(items: TeamMember[], matchingIds: Set<string>): Set<string> {
  const result = new Set<string>();
  
  const collectDescendants = (node: TeamMember) => {
    result.add(node.id);
    if (node.children) {
      node.children.forEach(collectDescendants);
    }
  };
  
  const walk = (nodes: TeamMember[]) => {
    nodes.forEach((node) => {
      if (matchingIds.has(node.id)) {
        collectDescendants(node);
      }
      if (node.children) {
        walk(node.children);
      }
    });
  };
  
  walk(items);
  return result;
}

// Internal component for rendering the hierarchical list
function HierarchicalTeamList({
  items,
  selectedId,
  onSelect,
  searchTerm = "",
  matchingIds = new Set(),
  expandedForSearch = new Set(),
}: {
  items: TeamMember[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchTerm?: string;
  matchingIds?: Set<string>;
  expandedForSearch?: Set<string>;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Initialize all items as expanded by default as seen in TeamManagementSettings
  useEffect(() => {
    const allIds = new Set<string>();
    function traverse(nodes: TeamMember[]) {
      nodes.forEach((node) => {
        allIds.add(node.id);
        if (node.children) traverse(node.children);
      });
    }
    traverse(items);
    setExpandedItems(allIds);
  }, [items]);

  // 검색어 유무에 따라 확장 상태 결정
  const currentExpanded = useMemo(() => {
    if (searchTerm) return expandedForSearch;
    return expandedItems;
  }, [searchTerm, expandedForSearch, expandedItems]);

  // 검색 중일 때 표시해야 할 노드들 (매칭 + 조상 + 자손)
  const visibleIds = useMemo(() => {
    if (!searchTerm || matchingIds.size === 0) return null;
    const matchingAndDescendants = collectMatchingAndDescendants(items, matchingIds);
    return new Set([...expandedForSearch, ...matchingAndDescendants]);
  }, [searchTerm, matchingIds, expandedForSearch, items]);

  const toggleExpand = useCallback((id: string) => {
    if (searchTerm) return;
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [searchTerm]);

  const renderItems = useCallback((nodes: TeamMember[]) => {
    // 검색 중일 때 visibleIds에 포함된 아이템만 필터링
    const filteredItems = visibleIds 
      ? nodes.filter((item) => visibleIds.has(item.id))
      : nodes;

    return filteredItems.map((item, index) => {
      const hasChildren = Boolean(item.children && item.children.length);
      // 자식들 중 표시될 것이 있는지 확인
      const visibleChildren = visibleIds && item.children
        ? item.children.filter((child) => visibleIds.has(child.id))
        : item.children;
      const hasVisibleChildren = Boolean(visibleChildren && visibleChildren.length);
      const isExpanded = currentExpanded.has(item.id);
      const level = item.level ?? 0;
      // 모바일에서 1rem(16px) 들여쓰기, 데스크탑에서 기존 값 사용
      const indent = level * 16; // 모바일: 16px per level
      const connectorLeft = (level - 1) * 16; // 모바일: 16px per level
      const isSelected = selectedId === Number(item.id);

      return (
        <div key={item.id} className="relative mb-2">
          {level > 0 && (
            <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-px bg-border md:!left-[var(--desktop-connector-left)]"
                  style={{
                    left: `${connectorLeft}px`,
                    '--desktop-connector-left': `${getConnectorLeft(level)}px`,
                    top: index === 0 ? HIERARCHY_LIST_TOKENS.connector.firstItemTopOffset : 0,
                  } as React.CSSProperties}
                />
                <div
                  className="absolute h-px bg-border md:!left-[var(--desktop-connector-left)] md:!w-[var(--desktop-horizontal-width)]"
                  style={{ 
                    left: `${connectorLeft}px`,
                    '--desktop-connector-left': `${getConnectorLeft(level)}px`,
                    '--desktop-horizontal-width': `${HIERARCHY_LIST_TOKENS.connector.horizontalWidth}px`,
                    top: HIERARCHY_LIST_TOKENS.connector.horizontalTop, 
                    width: '16px' // 모바일: 16px
                  } as React.CSSProperties}
                />
            </>
          )}
          <div
            className={`h-[52px] flex items-center px-4 md:px-6 gap-3 md:gap-4 border rounded-[12px] cursor-pointer transition-all md:!ml-[var(--desktop-indent)] ${
              item.isLeader ? "bg-primary-10/30 dark:bg-primary-10/20" : "bg-card dark:bg-neutral-10"
            } ${
              isSelected
                ? "border-[#51F8A5] border-2"
                : "border-neutral-30 dark:border-neutral-30 hover:border-primary-60"
            }`}
            style={{ 
              marginLeft: `${indent}px`,
              '--desktop-indent': `${getIndent(level)}px`,
            } as React.CSSProperties}
            onClick={() => onSelect(Number(item.id))}
          >
            {hasVisibleChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
                className={`cursor-pointer w-6 h-6 flex items-center justify-center border border-border rounded-[5px] hover:bg-neutral-10 transition-colors ${
                  isExpanded ? "" : "rotate-[-90deg]"
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="var(--neutral-60)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <></>
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-neutral-0 text-[14px] font-semibold ${
                item.isLeader ? "bg-primary-80" : "bg-neutral-60"
              }`}
            >
              {item.avatar}
            </div>
            <div className="text-left text-[16px] font-semibold text-foreground">
              {item.name}
            </div>
            {item.department && item.department !== "팀원" && (
              <div className="px-3 bg-secondary-10 rounded-[30px] max-h-[22px] flex items-center justify-center">
                <span className="text-[12px] font-medium text-secondary-40 leading-[22px]">
                  {item.department}
                </span>
              </div>
            )}
          </div>
          {hasVisibleChildren && isExpanded && item.children && (
            <div className="mt-2">{renderItems(item.children)}</div>
          )}
        </div>
      );
    });
  }, [visibleIds, currentExpanded, selectedId, onSelect, toggleExpand]);

  return <div>{renderItems(items)}</div>;
}

export default function AssignCustomersModal(props: AssignCustomersModalProps) {
  const { open, onClose, selectedCustomerIds, selectionMode, totalCount, onAssign, projectId } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const { user } = useMe();

  const { data: treeData, isLoading: treeLoading } = useMembersTree(projectId);
  const { data: teamsData } = useTeams(projectId);

  // ==========================================================================================
  // 검색 기능 관련 상태 및 핸들러
  // ==========================================================================================
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedForSearch, setExpandedForSearch] = useState<Set<string>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const teamNameByLeader = useMemo(() => {
    const map = new Map<number, string>();
    (teamsData ?? []).forEach((team) => {
      map.set(team.leaderMemberId, team.name);
    });
    return map;
  }, [teamsData]);

  const teamMembers = useMemo(
    () => transformMembers(treeData, teamNameByLeader),
    [treeData, teamNameByLeader]
  );

  const flattenedMembers = useMemo(() => flattenTeamData(teamMembers), [teamMembers]);

  // 모든 팀(department) 목록 - teamsData에서 가져옴
  const allDepartments = useMemo(() => {
    if (!teamsData) return [];
    return teamsData.map((team) => ({ id: team.id, name: team.name }));
  }, [teamsData]);

  const lowerSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  // 검색어에 매칭되는 멤버 ID 집합
  const matchingIds = useMemo(() => {
    if (!lowerSearch) return new Set<string>();
    return new Set(
      flattenedMembers
        .filter((member) =>
          member.name.toLowerCase().includes(lowerSearch) ||
          (member.department ? member.department.toLowerCase().includes(lowerSearch) : false)
        )
        .map((member) => member.id)
    );
  }, [flattenedMembers, lowerSearch]);

  // 검색 결과에 따른 확장 상태 업데이트
  const ensureExpandedForMatches = useCallback(
    (items: TeamMember[]) => {
      if (!lowerSearch) return;
      const next = new Set<string>();
      const walk = (nodes: TeamMember[], chain: string[] = []) => {
        nodes.forEach((node) => {
          const nextChain = [...chain, node.id];
          if (matchingIds.has(node.id)) {
            nextChain.slice(0, -1).forEach((id) => next.add(id));
          }
          if (node.children && node.children.length) {
            walk(node.children, nextChain);
          }
        });
      };
      walk(items);
      setExpandedForSearch(next);
    },
    [lowerSearch, matchingIds]
  );

  // searchTerm이 변경될 때만 확장 상태 업데이트
  useEffect(() => {
    if (lowerSearch) {
      ensureExpandedForMatches(teamMembers);
    } else {
      setExpandedForSearch(new Set());
    }
  }, [lowerSearch, ensureExpandedForMatches, teamMembers]);

  // 검색 실행 핸들러 (버튼 클릭 시에만 호출)
  const executeSearch = useCallback(() => {
    const value = inputValue.trim();
    setSearchTerm(value);
    if (!value) {
      setExpandedForSearch(new Set());
    }
  }, [inputValue]);

  // 부서 필터링된 멤버 데이터
  const filteredByDepartment = useMemo(() => {
    if (!selectedDepartment) return teamMembers;
    
    const filterTree = (items: TeamMember[]): TeamMember[] => {
      return items
        .map((item) => {
          const isMatch = item.department === selectedDepartment;
          const filteredChildren = item.children ? filterTree(item.children) : [];
          
          if (isMatch || filteredChildren.length > 0) {
            return {
              ...item,
              children: isMatch ? item.children : filteredChildren,
            };
          }
          return null;
        })
        .filter(Boolean) as TeamMember[];
    };
    
    return filterTree(teamMembers);
  }, [teamMembers, selectedDepartment]);

  // 부서 태그 클릭 핸들러
  const handleDepartmentClick = useCallback((dept: string) => {
    setSelectedDepartment((prev) => (prev === dept ? null : dept));
  }, []);

  useEffect(() => {
    if (open) {
      setTargetId(null);
      // 모달 열릴 때 검색 상태 초기화
      setInputValue("");
      setSearchTerm("");
      setSelectedDepartment(null);
      setExpandedForSearch(new Set());
    }
  }, [open]);

  if (!open) return null;

  const isLoading = loading || treeLoading;

  return (
    <BaseModal
      onClose={() => !loading && onClose()}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="relative w-full h-full md:w-[848px] md:h-auto md:min-h-[500px] md:max-h-[90vh] rounded-t-[14px] md:rounded-[14px] bg-card dark:bg-neutral-10 p-4 md:p-6 flex flex-col"
      ariaLabel="고객 배정"
      fullScreenOnMobile={true}
    >
      {/* Header row */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="md:hidden cursor-pointer p-1 -ml-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L8 12L15 5" stroke="currentColor" className="text-neutral-90 dark:text-neutral-90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="text-[18px] font-bold text-neutral-90 dark:text-neutral-90">고객배정</div>
        </div>
        <div onClick={onClose} className="hidden md:block cursor-pointer">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              className="text-neutral-50 dark:text-neutral-50"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="hidden mt-3 md:flex md:items-center md:gap-3 md:flex-shrink-0">
        <div className="text-[14px] text-neutral-60 dark:text-neutral-60">
          그룹 혹은 팀원에게 고객을 배정할 수 있습니다.
        </div>
        <span className="inline-flex items-center h-[22px] rounded-[30px] bg-primary-10 px-3 text-[12px] text-primary-80 opacity-80">
          선택된 고객 {selectionMode === "all" && totalCount !== undefined ? totalCount : selectedCustomerIds.length}
        </span>
      </div>

      <hr className="mt-3 border-neutral-30 dark:border-neutral-30 flex-shrink-0" />

      <div className="mt-4 md:mt-[30px] flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90 mb-3 flex-shrink-0 flex justify-between md:block">
          <span className="md:hidden">그룹</span>
          <span className="hidden md:inline">팀원 배정</span>
          <span className="md:hidden inline-flex items-center h-[22px] rounded-[30px] bg-primary-10 px-3 text-[12px] text-primary-80 opacity-80">
            선택된 고객 {selectionMode === "all" && totalCount !== undefined ? totalCount : selectedCustomerIds.length}명
          </span>
        </div>
        
        {/* 검색 및 태그 영역 */}
        <div className="mb-4 md:mb-[30px] flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-[10px] mb-3">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeSearch();
                  }
                }}
                placeholder="직원, 팀 이름을 검색하세요"
                className="w-full md:min-w-[248px] md:max-w-[296px] px-3 h-[40px] md:h-[34px] border border-border rounded-[8px] md:rounded-[5px] text-[14px] text-foreground bg-card dark:bg-neutral-10 focus:outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={executeSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden cursor-pointer p-1"
                aria-label="검색"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m21 21-4.35-4.35" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={executeSearch}
              className="hidden md:block cursor-pointer w-[66px] h-[34px] bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 rounded-[5px] text-[14px] font-semibold"
            >
              검색
            </button>
          </div>
          {allDepartments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-30 scrollbar-track-transparent pb-1">
              {allDepartments.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleDepartmentClick(tag.name)}
                  className={`px-3 py-1 rounded-[30px] leading-[1] max-h-[22px] flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    selectedDepartment === tag.name
                      ? "bg-secondary-40 text-neutral-0"
                      : "bg-neutral-30 dark:bg-neutral-30 text-neutral-70 dark:text-neutral-60 hover:bg-neutral-40 dark:hover:bg-neutral-40"
                  }`}
                >
                  <span className="text-[12px] font-medium leading-[1] whitespace-nowrap">{tag.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center text-neutral-60 dark:text-neutral-60 py-10">
              불러오는 중...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center mb-6">
                <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90 mb-2">
                  배정 가능한 직원이 없습니다
                </div>
                <div className="text-[14px] text-neutral-60 dark:text-neutral-60">
                  고객을 배정하려면 먼저 팀 멤버를 초대해야 합니다.
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  router.push("/settings?tab=member&openInvite=true");
                }}
                className="cursor-pointer h-[34px] px-4 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 text-[14px] font-semibold hover:opacity-90 transition-opacity"
              >
                팀 멤버 관리로 이동
              </button>
            </div>
          ) : (
            <HierarchicalTeamList
              items={filteredByDepartment}
              selectedId={targetId}
              onSelect={setTargetId}
              searchTerm={searchTerm}
              matchingIds={matchingIds}
              expandedForSearch={expandedForSearch}
            />
          )}
        </div>
      </div>

      <hr className="mt-4 md:mt-6 border-neutral-30 dark:border-neutral-30 flex-shrink-0" />

      <div className="mt-4 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="text-[13px] text-neutral-70 dark:text-neutral-60 hidden md:block">
          {/* {targetId ? (
            <>
              배정 대상 ID: <b>{targetId}</b>
            </>
          ) : (
            <>배정 대상을 선택하세요</>
          )} */}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="cursor-pointer flex-1 md:flex-none h-[40px] md:h-[34px] px-4 md:px-3 rounded-[8px] md:rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-[14px] text-neutral-90 dark:text-neutral-80 bg-neutral-0 dark:bg-neutral-10"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className="cursor-pointer flex-1 md:flex-none h-[40px] md:h-[34px] px-4 md:px-3 rounded-[8px] md:rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 text-[14px] font-semibold disabled:opacity-50"
            disabled={loading || !targetId}
            onClick={async () => {
              if (!targetId) return;
              setLoading(true);
              try {
                await onAssign(targetId);
                onClose();
              } catch (e: any) {
                showErrorModal({
                  title: "오류 발생",
                  headline: "배정에 실패했습니다. 잠시 후 다시 시도해주세요.",
                  confirmText: "확인",
                  cancelText: null,
                  hideCancel: true,
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            배정하기
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
