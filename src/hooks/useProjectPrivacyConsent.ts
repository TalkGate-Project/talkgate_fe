"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProjectPrivacyConsentService } from "@/services/projectPrivacyConsent";
import type { ProjectPrivacyConsentStatus } from "@/types/projectPrivacyConsent";

export const projectPrivacyConsentKeys = {
  all: ["projectPrivacyConsent"] as const,
  byProject: (projectId: string | number | null | undefined) =>
    [...projectPrivacyConsentKeys.all, projectId ? String(projectId) : null] as const,
};

export function useProjectPrivacyConsentStatus(
  projectId: string | number | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = Boolean(projectId) && (options?.enabled ?? true);

  const query = useQuery<ProjectPrivacyConsentStatus>({
    queryKey: projectPrivacyConsentKeys.byProject(projectId ?? null),
    enabled,
    queryFn: async () => {
      const res = await ProjectPrivacyConsentService.get(projectId as string | number);
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    status: query.data ?? null,
    isConsented: query.data?.isConsented ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  } as const;
}

export function useCreateProjectPrivacyConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string | number) => {
      try {
        const res = await ProjectPrivacyConsentService.create(projectId);
        return res.data.data;
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const code = (err as { data?: { code?: string } })?.data?.code;
        if (status === 409 || code === "ALREADY_EXISTS") {
          return null;
        }
        throw err;
      }
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({
        queryKey: projectPrivacyConsentKeys.byProject(projectId),
      });
    },
  });
}
