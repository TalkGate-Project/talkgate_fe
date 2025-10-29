"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TeamManagementHeader from "./teamManagement/TeamManagementHeader";
import TeamListView from "./teamManagement/TeamListView";
import TeamTreeView from "./teamManagement/TeamTreeView";
import { DragHandlers, DragState, flattenTeamData, isDescendant } from "./teamManagement/useTeamTree";
import { TeamMember } from "@/data/mockTeamData";
import { MemberTreeNode } from "@/types/membersTree";
import { getSelectedProjectId } from "@/lib/project";
import { useMembersTree, useTeams, useMoveTeamMutation, useCreateTeamMutation, useDeleteTeamMutation } from "@/hooks/useMembersTree";

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
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [selectedDeleteMemberId, setSelectedDeleteMemberId] = useState<string>("");

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
  const createTeamMutation = useCreateTeamMutation(projectId);
  const deleteTeamMutation = useDeleteTeamMutation(projectId);

  const teamNameByLeader = useMemo(() => {
    const map = new Map<number, string>();
    (teamsData ?? []).forEach((team) => {
      map.set(team.leaderMemberId, team.name);
    });
    return map;
  }, [teamsData]);

  const teamMembers = useMemo(() => transformMembers(treeData, teamNameByLeader), [treeData, teamNameByLeader]);
  const flattenedMembers = useMemo(() => flattenTeamData(teamMembers), [teamMembers]);

  useEffect(() => {
    if (flattenedMembers.length > 0) {
      setSelectedLeaderId(String(flattenedMembers[0].id));
    } else {
      setSelectedLeaderId("");
    }
  }, [flattenedMembers]);

  useEffect(() => {
    if (teamsData && teamsData.length > 0) {
      setSelectedDeleteMemberId(String(teamsData[0].leaderMemberId));
    } else {
      setSelectedDeleteMemberId("");
    }
  }, [teamsData]);

  const handleOpenTeamModal = () => {
    setTeamModalOpen(true);
    setTeamNameInput("");
  };

  const handleCloseTeamModal = () => {
    setTeamModalOpen(false);
    setTeamNameInput("");
  };

  const handleCreateTeam = async () => {
    if (!selectedLeaderId) return;
    const trimmed = teamNameInput.trim();
    if (!trimmed) {
      alert("팀 이름을 입력해주세요.");
      return;
    }
    try {
      await createTeamMutation.mutateAsync({ memberId: Number(selectedLeaderId), teamName: trimmed });
      handleCloseTeamModal();
    } catch (err) {
      console.error(err);
      alert((err as Error)?.message ?? "팀 생성에 실패했습니다.");
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedDeleteMemberId) return;
    if (!confirm("선택한 팀을 삭제하시겠습니까?")) return;
    try {
      await deleteTeamMutation.mutateAsync({ memberId: Number(selectedDeleteMemberId) });
      handleCloseTeamModal();
    } catch (err) {
      console.error(err);
      alert((err as Error)?.message ?? "팀 삭제에 실패했습니다.");
    }
  };

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
      if (member.department) set.add(member.department);
    });
    return Array.from(set);
  }, [flattenedMembers]);

  if (!projectId) return null;

  if (treeLoading) {
    return (
      <div className="w-full h-full bg-white rounded-[14px] p-8 flex items-center justify-center text-[#808080]">
        조직도를 불러오는 중입니다...
      </div>
    );
  }

  if (treeError) {
    return (
      <div className="w-full h-full bg-white rounded-[14px] p-8 flex flex-col gap-4 items-center justify-center text-[#D83232]">
        <span>조직 정보를 불러오지 못했습니다.</span>
        <button
          className="px-4 py-2 bg-[#252525] text-white rounded-[5px] text-[14px] font-semibold"
          onClick={() => location.reload()}
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-[14px] p-8 overflow-hidden">
      <TeamManagementHeader viewMode={viewMode} onChange={setViewMode} onCreateTeam={handleOpenTeamModal} creating={createTeamMutation.isPending || deleteTeamMutation.isPending} />
      <div className="w-full h-px bg-[#E2E2E2] mb-6" />
      {viewMode === "list" ? (
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <TeamListView data={teamMembers} dragHandlers={dragHandlers} dragState={dragState} tags={uniqueDepartments} />
        </div>
      ) : (
        <div className="-mx-8 -mb-8 overflow-x-auto overflow-y-hidden pb-8">
          <TeamTreeView data={teamMembers} dragHandlers={dragHandlers} dragState={dragState} />
        </div>
      )}

      {pendingMove && pendingMoveInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[16px] shadow-xl w-[420px] p-6">
            <h2 className="text-[18px] font-bold text-[#252525] mb-4">조직 이동 확인</h2>
            <div className="rounded-[12px] bg-[#F8F8F8] px-4 py-5 mb-5 flex flex-col gap-4">
              <div>
                <span className="block text-[12px] font-medium text-[#808080] mb-1">이동할 항목</span>
                <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-white text-[14px] font-semibold text-[#252525]">
                  {pendingMoveInfo.source.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="block text-[12px] font-medium text-[#808080] mb-1">현재 위치</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-[#FFF3DC] text-[14px] font-semibold text-[#BA7C12]">
                    {pendingMoveInfo.currentParent ? `${pendingMoveInfo.currentParent.name} (${pendingMoveInfo.currentParent.department})` : "루트"}
                  </span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1">
                  <span className="block text-[12px] font-medium text-[#808080] mb-1">이동할 위치</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-[#E4F7EF] text-[14px] font-semibold text-[#1F9E68]">
                    {`${pendingMoveInfo.target.name} (${pendingMoveInfo.target.department})`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelMove}
                className="px-4 py-2 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525]"
                disabled={moveMutation.isPending}
              >
                취소
              </button>
              <button
                onClick={confirmMove}
                className="px-4 py-2 rounded-[5px] bg-[#252525] text-white text-[14px] font-semibold"
                disabled={moveMutation.isPending}
              >
                {moveMutation.isPending ? "이동 중..." : "조직이동"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[16px] shadow-xl w-[420px] p-6">
            <h2 className="text-[18px] font-bold text-[#252525] mb-4">팀 관리</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#252525] mb-2">팀 생성</h3>
                <label className="block text-[12px] text-[#808080] mb-1">팀장 선택</label>
                <select
                  className="w-full border border-[#E2E2E2] rounded-[5px] px-3 py-2 text-[14px] text-[#252525]"
                  value={selectedLeaderId}
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                >
                  {flattenedMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <label className="block text-[12px] text-[#808080] mt-3 mb-1">팀 이름</label>
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder="팀 이름을 입력하세요"
                  className="w-full border border-[#E2E2E2] rounded-[5px] px-3 py-2 text-[14px] text-[#252525]"
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={createTeamMutation.isPending}
                  className="mt-3 w-full px-4 py-2 rounded-[5px] bg-[#252525] text-white text-[14px] font-semibold disabled:opacity-60"
                >
                  {createTeamMutation.isPending ? "생성 중..." : "팀 생성"}
                </button>
              </div>

              <div className="h-px bg-[#E2E2E2]" />

              <div>
                <h3 className="text-[14px] font-semibold text-[#252525] mb-2">팀 제거</h3>
                <label className="block text-[12px] text-[#808080] mb-1">팀 선택</label>
                <select
                  className="w-full border border-[#E2E2E2] rounded-[5px] px-3 py-2 text-[14px] text-[#252525]"
                  value={selectedDeleteMemberId}
                  onChange={(e) => setSelectedDeleteMemberId(e.target.value)}
                >
                  {(teamsData ?? []).map((team) => (
                    <option key={team.id} value={team.leaderMemberId}>
                      {team.name} (팀장: {team.leaderMemberName})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDeleteTeam}
                  disabled={deleteTeamMutation.isPending}
                  className="mt-3 w-full px-4 py-2 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525] disabled:opacity-60"
                >
                  {deleteTeamMutation.isPending ? "삭제 중..." : "팀 삭제"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseTeamModal}
                className="px-4 py-2 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525]"
                disabled={createTeamMutation.isPending || deleteTeamMutation.isPending}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}