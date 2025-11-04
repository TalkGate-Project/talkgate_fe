"use client";

import { useMemo } from "react";
import { CustomersService, CustomersListQuery, CustomersListResponse } from "@/services/customers";
import { useFetch } from "@/hooks/useFetch";

export function useCustomersList(params: CustomersListQuery | null) {
  // Build request only when params are available
  const request = useMemo(() => {
    if (!params) return undefined;
    return {
      query: {
        name: params.name,
        contact1: params.contact1,
        contact2: params.contact2,
        noteContent: params.noteContent,
        teamId: params.teamId,
        memberId: params.memberId,
        applicationRoute: params.applicationRoute,
        mediaCompany: params.mediaCompany,
        site: params.site,
        categoryIds: params.categoryIds,
        applicationDateFrom: params.applicationDateFrom,
        applicationDateTo: params.applicationDateTo,
        assignedAtFrom: params.assignedAtFrom,
        assignedAtTo: params.assignedAtTo,
        page: params.page,
        limit: params.limit,
      },
      headers: { "x-project-id": params.projectId },
    } as const;
  }, [params]);

  return useFetch<CustomersListResponse>("/v1/customers", { immediate: Boolean(request), request: request as any, deps: [request] });
}


