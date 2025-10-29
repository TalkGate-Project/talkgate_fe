"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { getSelectedProjectId } from "@/lib/project";
import { MyMember, MyMemberResponse } from "@/types/members";

async function fetchMyMember(projectId: string): Promise<MyMember> {
  const res = await apiClient.get<MyMemberResponse>("/v1/members/my", {
    headers: { "x-project-id": projectId },
  });
  return res.data.data;
}

export function useMyMember(projectId?: string | null) {
  const effectiveProjectId = projectId ?? getSelectedProjectId();

  const query = useQuery<MyMember>({
    queryKey: ["members", "my", effectiveProjectId],
    queryFn: () => fetchMyMember(effectiveProjectId as string),
    enabled: Boolean(effectiveProjectId),
  });

  return {
    member: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}
