"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MembersTreeService } from "@/services/membersTree";
import { MemberTreeNode } from "@/types/membersTree";

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
    onSuccess: async () => {
      if (!projectId) return;
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
