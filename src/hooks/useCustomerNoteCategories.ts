"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";
import { useSelectedProjectId } from "./useSelectedProjectId";
import { useAuthSession } from "./useAuthSession";

/** 캐시 무효화 시 사용 (예: 설정에서 카테고리 생성/수정/삭제 후) */
export const customerNoteCategoriesQueryKey = ["customer-note-categories"] as const;

function normalizeCategories(responseBody: unknown): CustomerNoteCategory[] {
  const data = (responseBody as any)?.data ?? (responseBody as any);
  return Array.isArray(data) ? data : [];
}

export function useCustomerNoteCategories() {
  const [projectId, projectReady] = useSelectedProjectId();
  const { hasAuthTokenHint } = useAuthSession();
  const hasAuthSession = hasAuthTokenHint;
  const enabled = projectReady && hasAuthSession && !!projectId;

  const query = useQuery({
    queryKey: [...customerNoteCategoriesQueryKey, projectId],
    queryFn: async () => {
      const res = await CustomerNoteCategoriesService.list();
      return normalizeCategories((res as any)?.data ?? res);
    },
    enabled,
  });

  const categories = query.data ?? [];
  return {
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
