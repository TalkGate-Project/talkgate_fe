"use client";

import { useQuery } from "@tanstack/react-query";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import type { Project } from "@/types/projects";

export function useCurrentProjectDetail() {
  const [projectId] = useSelectedProjectId();

  const { data, isLoading } = useQuery({
    queryKey: ["project", "detail", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Project | null> => {
      if (!projectId) return null;
      const res = await ProjectsService.detailById({
        "x-project-id": projectId,
      });
      return res.data?.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { project: data ?? null, isLoading };
}
