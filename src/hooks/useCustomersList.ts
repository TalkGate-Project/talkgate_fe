"use client";

import { useMemo } from "react";
import { CustomersListQuery, CustomersListResponse } from "@/services/customers";
import { useFetch } from "@/hooks/useFetch";

export function useCustomersList(params: CustomersListQuery | null) {
  // Build request only when params are available
  const request = useMemo(() => {
    if (!params) return undefined;
    // categoryIds에서 null을 문자열 "null"로 변환 (일반 카테고리)
    const categoryIds = params.categoryIds?.map((id: number | string) => {
      if (id === null) return "null";
      if (typeof id === "number") return id;
      return id; // 이미 문자열인 경우 (문자열 "null" 포함)
    });
    const { projectId, ...query } = params;

    return {
      // Forward the typed list query wholesale so newly added filters are not dropped here.
      query: {
        ...query,
        categoryIds: categoryIds,
      },
      headers: { "x-project-id": projectId },
    } as const;
  }, [params]);

  return useFetch<CustomersListResponse>("/v1/customers", { immediate: Boolean(request), request: request as any, deps: [request] });
}


