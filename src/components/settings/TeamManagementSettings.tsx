"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import TeamManagementHeader from "./teamManagement/TeamManagementHeader";
import TeamListView from "./teamManagement/TeamListView";
import TeamTreeView from "./teamManagement/TeamTreeView";
import TeamMemberInfoModal from "./teamManagement/TeamMemberInfoModal";
import UnassignedMembersList from "./teamManagement/UnassignedMembersList";
import { DragHandlers, DragState, flattenTeamData, isDescendant } from "@/hooks/useTeamTree";
import { TeamMember } from "@/types/teams";
import { MemberTreeNode } from "@/types/membersTree";
import { getSelectedProjectId } from "@/lib/project";
import { useMembersTree, useTeams, useMoveTeamMutation, useRemoveParentMutation } from "@/hooks/useMembersTree";
import { useMyMember } from "@/hooks/useMyMember";
import { showErrorModal } from "@/lib/errorModalEvents";

const ROLE_LABEL: Record<string, string> = {
  leader: "리더",
  member: "팀원",
};

function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
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
    const teamName = node.teamName || teamNameByLeader.get(node.id) || "";
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

// 멤버가 팀에 속해있는지 확인 (팀에 속함, 리더, 또는 하위 멤버가 있음)
function isAssignedMember(node: MemberTreeNode, teamNameByLeader: Map<number, string>): boolean {
  // 팀 이름이 있으면 배정됨
  if (node.teamName) return true;
  // 리더이면 배정됨
  if (node.role === "leader" || teamNameByLeader.has(node.id)) return true;
  // 하위 멤버가 있으면 배정됨
  if (node.descendants && node.descendants.length > 0) return true;
  return false;
}

type ViewMode = "list" | "tree";

type MoveContext = {
  sourceId: string;
  targetId: string;
};

function findNodeWithParent(tree: TeamMember[], targetId: string, parent?: TeamMember): { node: TeamMember; parent?: TeamMember } | null {
  for (const node of tree) {
    if (node.id === targetId) return { node, parent };
    if (node.children && node.children.length) {
      const found = findNodeWithParent(node.children, targetId, node);
      if (found) return found;
    }
  }
  return null;
}

export default function TeamManagementSettings() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [draggedItem, setDraggedItem] = useState<TeamMember | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<MoveContext | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isUnassignedDrawerOpen, setIsUnassignedDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const selected = getSelectedProjectId();
    if (!selected) {
      router.replace("/projects");
      return;
    }
    setProjectId(selected);
  }, [router]);

  const { data: treeData, isLoading: treeLoading, error: treeError } = useMembersTree(projectId);
  const { data: teamsData } = useTeams(projectId);
  const moveMutation = useMoveTeamMutation(projectId);
  const removeParentMutation = useRemoveParentMutation(projectId);
  const { isAdminOrSubAdmin } = useMyMember(projectId);

  const teamNameByLeader = useMemo(() => {
    const map = new Map<number, string>();
    (teamsData ?? []).forEach((team) => {
      map.set(team.leaderMemberId, team.name);
    });
    return map;
  }, [teamsData]);

  // 배정된 멤버와 미배정 멤버를 분리
  const { assignedTreeData, unassignedTreeData } = useMemo(() => {
    if (!treeData) return { assignedTreeData: [], unassignedTreeData: [] };
    
    const assigned: MemberTreeNode[] = [];
    const unassigned: MemberTreeNode[] = [];
    
    treeData.forEach((node) => {
      if (isAssignedMember(node, teamNameByLeader)) {
        assigned.push(node);
      } else {
        unassigned.push(node);
      }
    });
    
    return { assignedTreeData: assigned, unassignedTreeData: unassigned };
  }, [treeData, teamNameByLeader]);

  const teamMembers = useMemo(() => transformMembers(treeData, teamNameByLeader), [treeData, teamNameByLeader]);
  const assignedMembers = useMemo(() => transformMembers(assignedTreeData, teamNameByLeader), [assignedTreeData, teamNameByLeader]);
  const unassignedMembers = useMemo(() => transformMembers(unassignedTreeData, teamNameByLeader), [unassignedTreeData, teamNameByLeader]);
  const flattenedMembers = useMemo(() => flattenTeamData(teamMembers), [teamMembers]);

  const canDrag = !moveMutation.isPending && !removeParentMutation.isPending;

  const dragHandlers: DragHandlers = useMemo(() => ({
    handleDragStart: (e, item) => {
      if (!canDrag) return;
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.id);
    },
    handleDragOver: (e, targetId) => {
      if (!canDrag) return;
      e.preventDefault();
      if (draggedItem?.id === targetId) return;
      setDragOverItemId(targetId);
    },
    handleDragLeave: () => {
      if (!canDrag) return;
      setDragOverItemId(null);
    },
    handleDrop: (e, targetId) => {
      if (!canDrag) return;
      e.preventDefault();
      setDragOverItemId(null);
      if (!draggedItem || draggedItem.id === targetId) {
        setDraggedItem(null);
        return;
      }
      if (isDescendant(teamMembers, draggedItem.id, targetId)) {
        setDraggedItem(null);
        return;
      }
      setPendingMove({ sourceId: draggedItem.id, targetId });
    },
    handleDragEnd: () => {
      setDraggedItem(null);
      setDragOverItemId(null);
    },
  }), [canDrag, draggedItem, teamMembers]);

  const dragState: DragState = useMemo(() => ({
    draggedItemId: draggedItem ? draggedItem.id : null,
    dragOverItemId,
  }), [dragOverItemId, draggedItem]);

  const pendingMoveInfo = useMemo(() => {
    if (!pendingMove) return null;
    const sourceInfo = findNodeWithParent(teamMembers, pendingMove.sourceId);
    const targetInfo = findNodeWithParent(teamMembers, pendingMove.targetId);
    if (!sourceInfo || !targetInfo) return null;
    return {
      source: sourceInfo.node,
      currentParent: sourceInfo.parent,
      target: targetInfo.node,
    };
  }, [pendingMove, teamMembers]);

  // ==========================================================================================
  // 검색 기능 관련 상태 및 핸들러
  // ==========================================================================================
  const [inputValue, setInputValue] = useState(""); // 입력 필드 값 (실시간)
  const [searchTerm, setSearchTerm] = useState(""); // 실제 검색어 (버튼 클릭 시에만 업데이트)
  const [expandedForSearch, setExpandedForSearch] = useState<Set<string>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

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
    (items: TeamMember[], parents: string[] = []) => {
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
      walk(items, parents);
      setExpandedForSearch(next);
    },
    [lowerSearch, matchingIds]
  );

  // 검색 실행 핸들러 (버튼 클릭 시에만 호출)
  const executeSearch = useCallback(() => {
    const value = inputValue.trim();
    setSearchTerm(value);
    if (!value) {
      setExpandedForSearch(new Set());
    }
  }, [inputValue]);

  // searchTerm이 변경될 때만 확장 상태 업데이트
  useEffect(() => {
    if (lowerSearch) {
      ensureExpandedForMatches(teamMembers);
    } else {
      setExpandedForSearch(new Set());
    }
  }, [lowerSearch, ensureExpandedForMatches, teamMembers]);

  const confirmMove = useCallback(async () => {
    if (!pendingMove) return;
    try {
      await moveMutation.mutateAsync({
        memberId: Number(pendingMove.sourceId),
        newParentId: Number(pendingMove.targetId),
      });
      setPendingMove(null);
      setDraggedItem(null);
    } catch (err) {
      console.error(err);
      showErrorModal({
        type: "error",
        headline: "조직 이동에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    }
  }, [moveMutation, pendingMove]);

  const cancelMove = () => {
    setPendingMove(null);
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  const handleRemoveParentDrop = useCallback(async (memberId: string) => {
    if (!canDrag) return;
    try {
      await removeParentMutation.mutateAsync({
        memberId: Number(memberId),
      });
      setDraggedItem(null);
      setDragOverItemId(null);
    } catch (err) {
      console.error(err);
      showErrorModal({
        type: "error",
        headline: "소속 해제에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    }
  }, [canDrag, removeParentMutation]);

  // 모든 팀(department) 목록 - teamsData에서 가져옴
  const allDepartments = useMemo(() => {
    if (!teamsData) return [];
    return teamsData.map((team) => team.name);
  }, [teamsData]);

  // 부서 필터링된 멤버 데이터
  const filteredByDepartment = useMemo(() => {
    if (!selectedDepartment) return teamMembers;
    
    // 선택된 부서에 속하는 멤버와 그 자손들만 필터링
    const filterTree = (items: TeamMember[]): TeamMember[] => {
      return items
        .map((item) => {
          const isMatch = item.department === selectedDepartment;
          const filteredChildren = item.children ? filterTree(item.children) : [];
          
          // 본인이 매칭되거나 자손 중 매칭되는 것이 있으면 포함
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

  const handleMemberClick = useCallback((member: TeamMember) => {
    setSelectedMemberId(Number(member.id));
  }, []);

  const closeMemberModal = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  if (!projectId) return null;

  if (treeLoading) {
    return (
      <div className="w-full h-full bg-card rounded-[14px] p-8 flex items-center justify-center text-neutral-60">
        조직도를 불러오는 중입니다...
      </div>
    );
  }

  if (treeError) {
    return (
      <div className="w-full h-full bg-card rounded-[14px] p-8 flex flex-col gap-4 items-center justify-center text-danger-40">
        <span>조직 정보를 불러오지 못했습니다.</span>
        <button
          className="px-4 py-2 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
          onClick={() => location.reload()}
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-7 overflow-hidden flex flex-col">
      <TeamManagementHeader viewMode={viewMode} onChange={setViewMode} zoom={zoom} onZoomChange={setZoom} />
      <div className="mx-4 md:mx-7 h-px bg-neutral-30 mb-3" />

      {/* 검색 및 태그 영역 (스크롤되지 않는 상단 고정 영역) */}
      {viewMode === "list" && (
        <div className="px-4 md:px-7 mb-4 md:mb-[30px] flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4 mb-3">
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
                placeholder="직원 및 팀 이름을 검색하세요"
                className="w-full md:min-w-[280px] md:max-w-[294px] px-3 h-[34px] border border-neutral-30 rounded-[5px] text-[13px] md:text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
              />
            </div>
            <button
              type="button"
              onClick={executeSearch}
              className="cursor-pointer w-[60px] md:w-[66px] h-[34px] bg-neutral-90 text-neutral-0 rounded-[5px] text-[13px] md:text-[14px] font-semibold flex-shrink-0"
            >
              검색
            </button>
          </div>
          {allDepartments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-30 scrollbar-track-transparent pb-1">
              {allDepartments.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleDepartmentClick(tag)}
                  className={`px-3 py-1 rounded-[30px] leading-[1] max-h-[22px] flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    selectedDepartment === tag
                      ? "bg-secondary-40 text-neutral-0"
                      : "bg-neutral-30 text-neutral-70 hover:bg-neutral-40"
                  }`}
                >
                  <span className="text-[12px] font-medium leading-[1] whitespace-nowrap">{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 스크롤 가능한 리스트 영역 */}
      {viewMode === "list" ? (
        <div className="flex-1 px-4 md:px-7 overflow-y-auto min-h-0 max-h-[538px]">
          <TeamListView
            data={filteredByDepartment}
            dragHandlers={dragHandlers}
            dragState={dragState}
            tags={[]} // 태그는 상단으로 이동했으므로 빈 배열 전달
            onMemberClick={handleMemberClick}
            searchTerm={searchTerm} // 검색어 전달
            matchingIds={matchingIds} // 매칭 ID 전달
            expandedForSearch={expandedForSearch} // 검색 확장 상태 전달
          />
        </div>
      ) : (
        <div className="flex-1 mx-4 md:mx-7 overflow-hidden flex gap-4 border-b border-[#E2E2E2] dark:!border-[#444444] relative">
          {/* 트리 뷰 영역 - 스크롤은 TeamTreeView 내부에서만 처리 */}
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <TeamTreeView data={assignedMembers} dragHandlers={dragHandlers} dragState={dragState} onMemberClick={handleMemberClick} zoom={zoom} onZoomChange={setZoom} onRemoveParentDrop={handleRemoveParentDrop} canRemoveParent={isAdminOrSubAdmin} />
          </div>
          
          {/* 미배정 멤버 리스트 영역 - 데스크탑 */}
          {unassignedMembers.length > 0 && (
            <>
              <div className="hidden md:flex flex-shrink-0 w-[190px] bg-neutral-10/50 overflow-hidden flex-col border-[#E2E2E2] dark:!border-[#44444455] border-l">
                <div className="flex-1 overflow-y-auto max-h-[520px]">
                  <UnassignedMembersList 
                    data={unassignedMembers} 
                    dragHandlers={dragHandlers} 
                    dragState={dragState} 
                    onMemberClick={handleMemberClick} 
                  />
                </div>
              </div>
              
              {/* 모바일: 미배정 멤버 열기 버튼 */}
              <button
                type="button"
                onClick={() => setIsUnassignedDrawerOpen(true)}
                className="md:hidden fixed bottom-6 right-4 w-12 h-12 rounded-full bg-neutral-90 text-neutral-0 flex items-center justify-center shadow-lg z-40"
                aria-label="미배정 멤버 보기"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* 모바일: 미배정 멤버 드로워 */}
      <AnimatePresence>
        {isUnassignedDrawerOpen && unassignedMembers.length > 0 && (
          <>
            {/* Dimmed Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnassignedDrawerOpen(false)}
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[100] md:hidden"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-card dark:bg-neutral-10 z-[101] shadow-lg overflow-y-auto md:hidden"
            >
              {/* Header */}
              <div className="h-[64px] flex items-center justify-between px-4 border-b border-neutral-30 flex-shrink-0">
                <h3 className="text-[18px] font-semibold text-foreground">미배정 멤버</h3>
                <button
                  type="button"
                  onClick={() => setIsUnassignedDrawerOpen(false)}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-60"
                  aria-label="닫기"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {/* Content */}
              <div className="p-4">
                <UnassignedMembersList 
                  data={unassignedMembers} 
                  dragHandlers={dragHandlers} 
                  dragState={dragState} 
                  onMemberClick={(member) => {
                    handleMemberClick(member);
                    setIsUnassignedDrawerOpen(false);
                  }} 
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {pendingMove && pendingMoveInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-[12px] md:rounded-[16px] shadow-xl w-full max-w-[420px] p-4 md:p-6">
            <h2 className="text-[16px] md:text-[18px] font-bold text-foreground mb-4">조직 이동 확인</h2>
            <div className="rounded-[12px] bg-neutral-10 px-3 md:px-4 py-4 md:py-5 mb-4 md:mb-5 flex flex-col gap-3 md:gap-4">
              <div>
                <span className="block text-[12px] font-medium text-neutral-60 mb-1">이동할 항목</span>
                <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-card text-[13px] md:text-[14px] font-semibold text-foreground">
                  {pendingMoveInfo.source.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <span className="block text-[12px] font-medium text-neutral-60 mb-1">현재 위치</span>
                  <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-[6px] bg-warning-10 text-[12px] md:text-[14px] font-semibold text-warning-60 truncate">
                    {pendingMoveInfo.currentParent ? `${pendingMoveInfo.currentParent.name} (${pendingMoveInfo.currentParent.department})` : "루트"}
                  </span>
                </div>
                <svg width="20" height="20" className="md:w-6 md:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="block text-[12px] font-medium text-neutral-60 mb-1">이동할 위치</span>
                  <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-[6px] bg-primary-10 text-[12px] md:text-[14px] font-semibold text-primary-80 truncate">
                    {`${pendingMoveInfo.target.name} (${pendingMoveInfo.target.department})`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelMove}
                className="px-3 md:px-4 py-2 rounded-[5px] border border-border text-[13px] md:text-[14px] font-semibold text-foreground"
                disabled={moveMutation.isPending}
              >
                취소
              </button>
              <button
                onClick={confirmMove}
                className="px-3 md:px-4 py-2 rounded-[5px] bg-neutral-90 text-neutral-0 text-[13px] md:text-[14px] font-semibold"
                disabled={moveMutation.isPending}
              >
                {moveMutation.isPending ? "이동 중..." : "조직이동"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMemberId && (
        <TeamMemberInfoModal open={Boolean(selectedMemberId)} memberId={selectedMemberId} onClose={closeMemberModal} projectId={projectId} />
      )}
    </div>
  );
}