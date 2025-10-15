"use client";

import { useMemo } from "react";
import { CustomersService, CustomersListQuery, CustomersListResponse } from "@/services/customers";
import { useFetch } from "@/hooks/useFetch";

export function useCustomersList(params: CustomersListQuery) {
  // Use a stable key string for path; actual query and headers go via request options
  const request = useMemo(() => ({
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
  }), [params]);

  return useFetch<CustomersListResponse>("/v1/customers", { request, deps: [request] });
}


