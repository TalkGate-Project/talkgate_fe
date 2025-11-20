"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TeamManagementHeader from "./teamManagement/TeamManagementHeader";
import TeamListView from "./teamManagement/TeamListView";
import TeamTreeView from "./teamManagement/TeamTreeView";
import TeamMemberInfoModal from "./teamManagement/TeamMemberInfoModal";
import { DragHandlers, DragState, flattenTeamData, isDescendant } from "@/hooks/useTeamTree";
import { TeamMember } from "@/data/mockTeamData";
import { MemberTreeNode } from "@/types/membersTree";
import { getSelectedProjectId } from "@/lib/project";
import { useMembersTree, useTeams, useMoveTeamMutation } from "@/hooks/useMembersTree";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [draggedItem, setDraggedItem] = useState<TeamMember | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<MoveContext | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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

  const teamNameByLeader = useMemo(() => {
    const map = new Map<number, string>();
    (teamsData ?? []).forEach((team) => {
      map.set(team.leaderMemberId, team.name);
    });
    return map;
  }, [teamsData]);

  const teamMembers = useMemo(() => transformMembers(treeData, teamNameByLeader), [treeData, teamNameByLeader]);
  const flattenedMembers = useMemo(() => flattenTeamData(teamMembers), [teamMembers]);

  const canDrag = !moveMutation.isPending;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedForSearch, setExpandedForSearch] = useState<Set<string>>(new Set());

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

  // 검색어 변경 핸들러
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      setExpandedForSearch(new Set());
    } else {
      ensureExpandedForMatches(teamMembers);
    }
  };

  useEffect(() => {
    if (lowerSearch) {
      ensureExpandedForMatches(teamMembers);
    }
  }, [teamMembers, lowerSearch, ensureExpandedForMatches]);

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
      alert((err as Error)?.message ?? "조직 이동에 실패했습니다.");
    }
  }, [moveMutation, pendingMove]);

  const cancelMove = () => {
    setPendingMove(null);
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    flattenedMembers.forEach((member) => {
      if (member.department && member.department !== "팀원") set.add(member.department);
    });
    return Array.from(set);
  }, [flattenedMembers]);

  const selectedMember = useMemo(
    () => (selectedMemberId ? flattenedMembers.find((member) => member.id === selectedMemberId) ?? null : null),
    [flattenedMembers, selectedMemberId]
  );

  const handleMemberClick = useCallback((member: TeamMember) => {
    setSelectedMemberId(member.id);
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
    <div className="w-full h-full bg-card rounded-[14px] py-7 overflow-hidden flex flex-col">
      <TeamManagementHeader viewMode={viewMode} onChange={setViewMode} />
      <div className="mx-7 h-px bg-neutral-30 mb-3" />

      {/* 검색 및 태그 영역 (스크롤되지 않는 상단 고정 영역) */}
      {viewMode === "list" && (
        <div className="px-7 mb-[30px] flex-shrink-0">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="직원 및 팀 이름을 검색하세요"
                className="w-full max-w-[294px] px-3 h-[34px] border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
              />
            </div>
            <button className="cursor-pointer w-[66px] h-[34px] bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold">
              검색
            </button>
          </div>
          {uniqueDepartments.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {uniqueDepartments.map((tag) => (
                <div key={tag} className="px-3 py-1 bg-neutral-30 rounded-[30px] leading-[1] max-h-[22px]">
                  <span className="text-[12px] font-medium text-neutral-70 leading-[1]">{tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 스크롤 가능한 리스트 영역 */}
      {viewMode === "list" ? (
        <div className="flex-1 px-7 overflow-y-auto min-h-0 max-h-[538px]">
          <TeamListView
            data={teamMembers}
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
        <div className="flex-1 px-7 -mx-8 -mb-8 overflow-x-auto overflow-y-hidden pb-8">
          <TeamTreeView data={teamMembers} dragHandlers={dragHandlers} dragState={dragState} onMemberClick={handleMemberClick} />
        </div>
      )}

      {pendingMove && pendingMoveInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-[16px] shadow-xl w-[420px] p-6">
            <h2 className="text-[18px] font-bold text-foreground mb-4">조직 이동 확인</h2>
            <div className="rounded-[12px] bg-neutral-10 px-4 py-5 mb-5 flex flex-col gap-4">
              <div>
                <span className="block text-[12px] font-medium text-neutral-60 mb-1">이동할 항목</span>
                <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-card text-[14px] font-semibold text-foreground">
                  {pendingMoveInfo.source.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="block text-[12px] font-medium text-neutral-60 mb-1">현재 위치</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-warning-10 text-[14px] font-semibold text-warning-60">
                    {pendingMoveInfo.currentParent ? `${pendingMoveInfo.currentParent.name} (${pendingMoveInfo.currentParent.department})` : "루트"}
                  </span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1">
                  <span className="block text-[12px] font-medium text-neutral-60 mb-1">이동할 위치</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-primary-10 text-[14px] font-semibold text-primary-80">
                    {`${pendingMoveInfo.target.name} (${pendingMoveInfo.target.department})`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelMove}
                className="px-4 py-2 rounded-[5px] border border-border text-[14px] font-semibold text-foreground"
                disabled={moveMutation.isPending}
              >
                취소
              </button>
              <button
                onClick={confirmMove}
                className="px-4 py-2 rounded-[5px] bg-neutral-90 text-neutral-0 text-[14px] font-semibold"
                disabled={moveMutation.isPending}
              >
                {moveMutation.isPending ? "이동 중..." : "조직이동"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <TeamMemberInfoModal open={Boolean(selectedMember)} member={selectedMember} onClose={closeMemberModal} projectId={projectId} />
      )}
    </div>
  );
}