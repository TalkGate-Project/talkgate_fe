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
    return {
      query: {
        name: params.name,
        contact1: params.contact1,
        contact2: params.contact2,
        noteContent: params.noteContent,
        assignType: params.assignType,
        filterByLatestCategory: params.filterByLatestCategory,
        apiKeyId: params.apiKeyId,
        projectPartnerId: params.projectPartnerId,
        teamId: params.teamId,
        memberId: params.memberId,
        applicationRoute: params.applicationRoute,
        mediaCompany: params.mediaCompany,
        site: params.site,
        categoryIds: categoryIds,
        applicationDateFrom: params.applicationDateFrom,
        applicationDateTo: params.applicationDateTo,
        assignedAtFrom: params.assignedAtFrom,
        assignedAtTo: params.assignedAtTo,
        sortType: params.sortType,
        sortOrder: params.sortOrder,
        page: params.page,
        limit: params.limit,
      },
      headers: { "x-project-id": params.projectId },
    } as const;
  }, [params]);

  return useFetch<CustomersListResponse>("/v1/customers", { immediate: Boolean(request), request: request as any, deps: [request] });
}


