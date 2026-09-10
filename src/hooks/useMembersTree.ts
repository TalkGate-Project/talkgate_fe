"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberDetailQueryKey } from "@/hooks/useMemberDetail";
import { MembersTreeService } from "@/services/membersTree";
import { MemberTreeNode } from "@/types/membersTree";
import type { MemberDetail } from "@/types/members";

const treeQueryKey = (projectId: string | number | null | undefined) => ["members-tree", "tree", projectId];
const treeWithoutParentQueryKey = (projectId: string | number | null | undefined) => ["members-tree", "tree", "without-parent", projectId];
const treeWithoutParentWithAssignmentCountQueryKey = (projectId: string | number | null | undefined) => [
  "members-tree",
  "tree",
  "without-parent",
  "with-assignment-count",
  projectId,
];
const teamsQueryKey = (projectId: string | number | null | undefined) => ["members-tree", "teams", projectId];

export function useMembersTree(
  projectId?: string | number | null,
  options?: { enabled?: boolean }
) {
  return useQuery<MemberTreeNode[]>({
    queryKey: treeQueryKey(projectId ?? null),
    queryFn: () => MembersTreeService.fetchRoot(projectId as string | number),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : Boolean(projectId),
  });
}

export function useMembersTreeWithoutParent(
  projectId?: string | number | null,
  options?: { enabled?: boolean }
) {
  return useQuery<MemberTreeNode[]>({
    queryKey: treeWithoutParentQueryKey(projectId ?? null),
    queryFn: () => MembersTreeService.fetchRootWithoutParent(projectId as string | number),
    // 다른 탭에서 조직을 변경한 뒤 돌아온 경우에도 즉시 최신 조직도를 받는다.
    refetchOnWindowFocus: "always",
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : Boolean(projectId),
  });
}

export function useMembersTreeWithoutParentWithAssignmentCount(
  projectId?: string | number | null,
  options?: { enabled?: boolean }
) {
  return useQuery<MemberTreeNode[]>({
    queryKey: treeWithoutParentWithAssignmentCountQueryKey(projectId ?? null),
    queryFn: () =>
      MembersTreeService.fetchRootWithoutParentWithAssignmentCount(projectId as string | number),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : Boolean(projectId),
  });
}

export function useTeams(
  projectId?: string | number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: teamsQueryKey(projectId ?? null),
    queryFn: () => MembersTreeService.fetchTeams(projectId as string | number),
    // 팀장 교체·팀 생성/삭제는 다른 탭에서 발생할 수 있다.
    refetchOnWindowFocus: "always",
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : Boolean(projectId),
  });
}

export function useMoveTeamMutation(projectId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: number; newParentId: number }) => {
      if (!projectId) throw new Error("프로젝트가 선택되지 않았습니다.");
      return MembersTreeService.moveTeam({ ...input, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: treeWithoutParentQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId ?? null) });
    },
  });
}

export function useCreateTeamMutation(projectId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: number; teamName: string }) => {
      if (!projectId) throw new Error("프로젝트가 선택되지 않았습니다.");
      return MembersTreeService.createTeam({ ...input, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: treeWithoutParentQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId ?? null) });
    },
  });
}

export function useDeleteTeamMutation(projectId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: number }) => {
      if (!projectId) throw new Error("프로젝트가 선택되지 않았습니다.");
      return MembersTreeService.deleteTeam({ ...input, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: treeWithoutParentQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId ?? null) });
    },
  });
}

export function useUpdateTeamMutation(projectId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: number; teamName: string }) => {
      if (!projectId) throw new Error("프로젝트가 선택되지 않았습니다.");
      return MembersTreeService.updateTeam({ ...input, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: treeWithoutParentQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId ?? null) });
    },
  });
}

export function useRemoveParentMutation(projectId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: number }) => {
      if (!projectId) throw new Error("프로젝트가 선택되지 않았습니다.");
      return MembersTreeService.removeParent({ ...input, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: treeWithoutParentQueryKey(projectId ?? null) });
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId ?? null) });
    },
  });
}

export function useAssignTeamLeaderMutation(projectId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: number; newLeaderMemberId: number }) => {
      if (!projectId) throw new Error("프로젝트가 선택되지 않았습니다.");
      return MembersTreeService.replaceTeamLeader({ ...input, projectId });
    },
    onSuccess: async (_data, { memberId, newLeaderMemberId }) => {
      if (!projectId) return;

      const formerLeaderQueryKey = memberDetailQueryKey(projectId, memberId);
      const newLeaderQueryKey = memberDetailQueryKey(projectId, newLeaderMemberId);
      const formerLeader = queryClient.getQueryData<MemberDetail>(formerLeaderQueryKey);
      const newLeader = queryClient.getQueryData<MemberDetail>(newLeaderQueryKey);
      const nextTeamInfo = formerLeader?.teamInfo ?? newLeader?.teamInfo;

      // 재조회 전에 상세 캐시를 먼저 교체해, 열린 직원정보 모달의 버튼이
      // 이전 역할로 렌더링됐다가 다시 바뀌는 것을 막는다.
      queryClient.setQueryData<MemberDetail>(formerLeaderQueryKey, (currentMember) =>
        currentMember
          ? {
              ...currentMember,
              role: "member",
              teamInfo: nextTeamInfo
                ? {
                    ...nextTeamInfo,
                    leaderMemberId: newLeaderMemberId,
                    leaderMemberName: newLeader?.name ?? nextTeamInfo.leaderMemberName,
                  }
                : currentMember.teamInfo,
            }
          : currentMember
      );
      queryClient.setQueryData<MemberDetail>(newLeaderQueryKey, (currentMember) =>
        currentMember
          ? {
              ...currentMember,
              role: "leader",
              teamInfo: nextTeamInfo
                ? {
                    ...nextTeamInfo,
                    leaderMemberId: newLeaderMemberId,
                    leaderMemberName: currentMember.name,
                  }
                : currentMember.teamInfo,
            }
          : currentMember
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: formerLeaderQueryKey }),
        queryClient.invalidateQueries({ queryKey: newLeaderQueryKey }),
      ]);
      try {
        const [nextTree, nextTeams] = await Promise.all([
          MembersTreeService.fetchRootWithoutParent(projectId),
          MembersTreeService.fetchTeams(projectId),
        ]);
        queryClient.setQueryData(treeWithoutParentQueryKey(projectId), nextTree);
        queryClient.setQueryData(teamsQueryKey(projectId), nextTeams);
      } catch (error) {
        console.error("Failed to refresh team leader change data:", error);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: treeWithoutParentQueryKey(projectId) }),
          queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId) }),
        ]);
      }
      queryClient.invalidateQueries({ queryKey: treeQueryKey(projectId) });
    },
  });
}
