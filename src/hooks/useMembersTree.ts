"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MembersTreeService } from "@/services/membersTree";
import { MemberTreeNode } from "@/types/membersTree";

const treeQueryKey = (projectId: string | number | null | undefined) => ["members-tree", "tree", projectId];
const teamsQueryKey = (projectId: string | number | null | undefined) => ["members-tree", "teams", projectId];

export function useMembersTree(projectId?: string | number | null) {
  return useQuery<MemberTreeNode[]>({
    queryKey: treeQueryKey(projectId ?? null),
    queryFn: () => MembersTreeService.fetchRoot(projectId as string | number),
    enabled: Boolean(projectId),
  });
}

export function useTeams(projectId?: string | number | null) {
  return useQuery({
    queryKey: teamsQueryKey(projectId ?? null),
    queryFn: () => MembersTreeService.fetchTeams(projectId as string | number),
    enabled: Boolean(projectId),
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
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId ?? null) });
    },
  });
}
