import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomersListQuery } from "@/types/customers";

export type CustomerFilters = {
  name?: string;
  contact1?: string;
  teamId?: number;
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: number[];
  noteContent?: string;
  applicationDateFrom?: string;
  applicationDateTo?: string;
  assignedAtFrom?: string;
  assignedAtTo?: string;
};

export function useCustomersFilters(projectId: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Applied filters are read from the URL; local filters are draft values edited in inputs/modals
  const applied = useMemo(() => {
    const obj: any = {};
    if (!searchParams) return obj;
    function g(key: string) {
      return searchParams.get(key) || undefined;
    }
    function gi(key: string) {
      const v = g(key);
      return v ? Number(v) : undefined;
    }
    function ga(key: string) {
      const vals = searchParams.getAll(key);
      return vals.length ? vals.map((v) => Number(v)) : undefined;
    }
    obj.name = g("name");
    obj.contact1 = g("contact1");
    obj.contact2 = g("contact2");
    obj.noteContent = g("noteContent");
    obj.assignType = g("assignType");
    obj.teamId = gi("teamId");
    obj.memberId = gi("memberId");
    obj.applicationRoute = g("applicationRoute");
    obj.mediaCompany = g("mediaCompany");
    obj.site = g("site");
    obj.categoryIds = ga("categoryIds");
    obj.applicationDateFrom = g("applicationDateFrom");
    obj.applicationDateTo = g("applicationDateTo");
    obj.assignedAtFrom = g("assignedAtFrom");
    obj.assignedAtTo = g("assignedAtTo");
    obj.page = Number(searchParams.get("page") || "1");
    obj.limit = Number(searchParams.get("limit") || "10");
    return obj;
  }, [searchParams]);

  // Sync local UI states with applied URL on mount/URL change
  useEffect(() => {
    // Keep page/limit in sync with URL only
    setPage(applied.page || 1);
    setLimit(applied.limit || 10);
    // Only update draft filters when URL truly changes values; avoid infinite loops
    setFilters((prev) => {
      const next = {
        name: applied.name,
        contact1: applied.contact1,
        teamId: applied.teamId,
        memberId: applied.memberId,
        applicationRoute: applied.applicationRoute,
        mediaCompany: applied.mediaCompany,
        site: applied.site,
        categoryIds: applied.categoryIds,
        noteContent: applied.noteContent,
        applicationDateFrom: applied.applicationDateFrom,
        applicationDateTo: applied.applicationDateTo,
        assignedAtFrom: applied.assignedAtFrom,
        assignedAtTo: applied.assignedAtTo,
      } as CustomerFilters;
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(next);
      return prevStr === nextStr ? prev : next;
    });
  }, [applied]);

  const query: CustomersListQuery | null = useMemo(
    () =>
      projectId
        ? {
            projectId,
            page: applied.page || 1,
            limit: applied.limit || 10,
            name: applied.name,
            contact1: applied.contact1,
            teamId: applied.teamId,
            memberId: applied.memberId,
            applicationRoute: applied.applicationRoute,
            mediaCompany: applied.mediaCompany,
            site: applied.site,
            categoryIds: applied.categoryIds,
            noteContent: applied.noteContent,
            applicationDateFrom: applied.applicationDateFrom,
            applicationDateTo: applied.applicationDateTo,
            assignedAtFrom: applied.assignedAtFrom,
            assignedAtTo: applied.assignedAtTo,
          }
        : null,
    [projectId, applied]
  );

  // Keep URL in sync for pagination/limit so data fetching follows
  function pushPage(nextPage: number, nextLimit?: number) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(nextLimit ?? limit));
    router.push(`/customers?${params.toString()}`, { scroll: false });
  }

  function buildFilterParams(filterValues: CustomerFilters): URLSearchParams {
    const params = new URLSearchParams();
    function setIf(key: string, val?: any) {
      if (val !== undefined && val !== null && val !== "") params.set(key, String(val));
    }
    setIf("page", 1);
    setIf("limit", limit);
    setIf("name", filterValues.name);
    setIf("contact1", filterValues.contact1);
    setIf("teamId", filterValues.teamId);
    setIf("memberId", filterValues.memberId);
    setIf("applicationRoute", filterValues.applicationRoute);
    setIf("mediaCompany", filterValues.mediaCompany);
    setIf("site", filterValues.site);
    if (filterValues.categoryIds && filterValues.categoryIds.length) {
      filterValues.categoryIds.forEach((id) => params.append("categoryIds", String(id)));
    }
    setIf("noteContent", filterValues.noteContent);
    setIf("applicationDateFrom", filterValues.applicationDateFrom);
    setIf("applicationDateTo", filterValues.applicationDateTo);
    setIf("assignedAtFrom", filterValues.assignedAtFrom);
    setIf("assignedAtTo", filterValues.assignedAtTo);
    return params;
  }

  function applyFilters(filterValues?: CustomerFilters) {
    // Apply draft filters to URL; this triggers data fetching
    const valuesToApply = filterValues ?? filters;
    const params = buildFilterParams(valuesToApply);
    router.push(`/customers?${params.toString()}`);
  }

  function removeFilter(key: keyof CustomerFilters) {
    setFilters((f) => ({ ...f, [key]: undefined }));
  }

  function removeCategoryFilter(id: number) {
    setFilters((f) => ({
      ...f,
      categoryIds: (f.categoryIds || []).filter((x) => x !== id),
    }));
  }

  function removeDateRangeFilter(type: "application" | "assigned") {
    if (type === "application") {
      setFilters((f) => ({
        ...f,
        applicationDateFrom: undefined,
        applicationDateTo: undefined,
      }));
    } else {
      setFilters((f) => ({
        ...f,
        assignedAtFrom: undefined,
        assignedAtTo: undefined,
      }));
    }
  }

  function removeFilterAndApply(key: keyof CustomerFilters) {
    const updated = { ...filters, [key]: undefined };
    setFilters(updated);
    applyFilters(updated);
  }

  function removeCategoryFilterAndApply(id: number) {
    const updated = {
      ...filters,
      categoryIds: (filters.categoryIds || []).filter((x) => x !== id),
    };
    setFilters(updated);
    applyFilters(updated);
  }

  function removeDateRangeFilterAndApply(type: "application" | "assigned") {
    const updated =
      type === "application"
        ? {
            ...filters,
            applicationDateFrom: undefined,
            applicationDateTo: undefined,
          }
        : {
            ...filters,
            assignedAtFrom: undefined,
            assignedAtTo: undefined,
          };
    setFilters(updated);
    applyFilters(updated);
  }

  return {
    filters,
    setFilters,
    page,
    setPage,
    limit,
    setLimit,
    query,
    applied,
    pushPage,
    applyFilters,
    removeFilter,
    removeCategoryFilter,
    removeDateRangeFilter,
    removeFilterAndApply,
    removeCategoryFilterAndApply,
    removeDateRangeFilterAndApply,
  };
}

