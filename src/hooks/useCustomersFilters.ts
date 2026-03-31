import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomersListQuery } from "@/types/customers";
import { sanitizeContactFilterInput } from "@/utils/format";

const CUSTOMER_FILTER_STORAGE_KEY_PREFIX = "tg_customers_last_filters";
const PERSISTABLE_FILTER_KEYS: (keyof CustomerFilters)[] = [
  "name",
  "contact1",
  "assignType",
  "filterByLatestCategory",
  "apiKeyId",
  "projectPartnerId",
  "teamId",
  "memberId",
  "applicationRoute",
  "mediaCompany",
  "site",
  "categoryIds",
  "noteContent",
  "applicationDateFrom",
  "applicationDateTo",
  "assignedAtFrom",
  "assignedAtTo",
  "keyword",
  "ipAddress",
  "notablePoints",
  "summaryInfo",
];

export type CustomerFilters = {
  name?: string;
  contact1?: string;
  assignType?: "all" | "assigned" | "unassigned";
  filterByLatestCategory?: boolean;
  apiKeyId?: number;
  projectPartnerId?: number;
  teamId?: number;
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: (number | null)[];
  noteContent?: string;
  applicationDateFrom?: string;
  applicationDateTo?: string;
  assignedAtFrom?: string;
  assignedAtTo?: string;
  keyword?: string;
  ipAddress?: string;
  notablePoints?: string;
  summaryInfo?: string;
};
export type CustomerSortType = "applicationDate" | "assignedMember";
export type CustomerSortOrder = "ASC" | "DESC";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getCustomerFilterStorageKey(projectId: string): string {
  return `${CUSTOMER_FILTER_STORAGE_KEY_PREFIX}:${projectId}`;
}

function extractPersistableFilters(source: Partial<CustomerFilters>): CustomerFilters {
  const persistedFilters: CustomerFilters = {};

  PERSISTABLE_FILTER_KEYS.forEach((key) => {
    const value = source[key];

    if (Array.isArray(value)) {
      if (value.length > 0) {
        persistedFilters[key] = value as never;
      }
      return;
    }

    if (typeof value === "string") {
      if (value.trim() !== "") {
        persistedFilters[key] = value as never;
      }
      return;
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        persistedFilters[key] = value as never;
      }
      return;
    }

    if (key === "filterByLatestCategory" && value === false) {
      persistedFilters[key] = false as never;
    }
  });

  return persistedFilters;
}

function hasPersistableFilters(filters: CustomerFilters): boolean {
  return Object.keys(filters).length > 0;
}

function readPersistedFilters(projectId: string): CustomerFilters | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(getCustomerFilterStorageKey(projectId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const persistedFilters = extractPersistableFilters(parsed as Partial<CustomerFilters>);
    return hasPersistableFilters(persistedFilters) ? persistedFilters : null;
  } catch (error) {
    console.error("Failed to read persisted customer filters:", error);
    return null;
  }
}

function writePersistedFilters(projectId: string, filters: CustomerFilters) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      getCustomerFilterStorageKey(projectId),
      JSON.stringify(filters)
    );
  } catch (error) {
    console.error("Failed to persist customer filters:", error);
  }
}

function clearPersistedFilters(projectId: string) {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(getCustomerFilterStorageKey(projectId));
  } catch (error) {
    console.error("Failed to clear persisted customer filters:", error);
  }
}

export function useCustomersFilters(projectId: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [isRestoreReady, setIsRestoreReady] = useState<boolean>(false);

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
      return vals.length ? vals.map((v) => {
        if (v === "" || v === "null") return null;
        const num = Number(v);
        return isNaN(num) ? null : num;
      }) : undefined;
    }
    function gb(key: string) {
      const v = g(key);
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    }
    obj.name = g("name");
    {
      const rawContact1 = searchParams.get("contact1");
      obj.contact1 =
        rawContact1 != null && rawContact1 !== ""
          ? sanitizeContactFilterInput(rawContact1) || undefined
          : undefined;
    }
    obj.contact2 = g("contact2");
    obj.noteContent = g("noteContent");
    obj.assignType = g("assignType");
    obj.filterByLatestCategory = gb("filterByLatestCategory") ?? true;
    obj.apiKeyId = gi("apiKeyId");
    obj.projectPartnerId = gi("projectPartnerId");
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
    obj.keyword = g("keyword");
    obj.ipAddress = g("ipAddress");
    obj.notablePoints = g("notablePoints");
    obj.summaryInfo = g("summaryInfo");
    const rawSortType = g("sortType");
    const rawSortOrder = g("sortOrder");
    obj.sortType =
      rawSortType === "applicationDate" || rawSortType === "assignedMember"
        ? rawSortType
        : undefined;
    obj.sortOrder =
      rawSortOrder === "ASC" || rawSortOrder === "DESC"
        ? rawSortOrder
        : undefined;
    obj.page = Number(searchParams.get("page") || "1");
    obj.limit = Number(searchParams.get("limit") || "10");
    return obj;
  }, [searchParams]);

  useEffect(() => {
    setIsRestoreReady(false);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !searchParams) return;

    const currentQueryString = searchParams.toString();
    if (currentQueryString) {
      setIsRestoreReady(true);
      return;
    }

    const persistedFilters = readPersistedFilters(projectId);
    if (!persistedFilters) {
      setIsRestoreReady(true);
      return;
    }

    const restoredParams = buildFilterParams(persistedFilters);
    const restoredQueryString = restoredParams.toString();

    if (!restoredQueryString) {
      setIsRestoreReady(true);
      return;
    }

    router.replace(`/customers?${restoredQueryString}`, { scroll: false });
  }, [projectId, router, searchParams, limit]);

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
        assignType: applied.assignType,
        filterByLatestCategory: applied.filterByLatestCategory ?? true,
        apiKeyId: applied.apiKeyId,
        projectPartnerId: applied.projectPartnerId,
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
        keyword: applied.keyword,
        ipAddress: applied.ipAddress,
        notablePoints: applied.notablePoints,
        summaryInfo: applied.summaryInfo,
      } as CustomerFilters;
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(next);
      return prevStr === nextStr ? prev : next;
    });
  }, [applied]);

  useEffect(() => {
    if (!projectId || !isRestoreReady) return;

    const persistedFilters = extractPersistableFilters(applied);

    if (!hasPersistableFilters(persistedFilters)) {
      clearPersistedFilters(projectId);
      return;
    }

    writePersistedFilters(projectId, persistedFilters);
  }, [applied, isRestoreReady, projectId]);

  const query: CustomersListQuery | null = useMemo(
    () =>
      projectId && isRestoreReady
        ? {
            projectId,
            page: applied.page || 1,
            limit: applied.limit || 10,
            name: applied.name,
            contact1: applied.contact1,
            assignType: applied.assignType,
            filterByLatestCategory: applied.filterByLatestCategory ?? true,
            apiKeyId: applied.apiKeyId,
            projectPartnerId: applied.projectPartnerId,
            teamId: applied.teamId,
            memberId: applied.memberId,
            applicationRoute: applied.applicationRoute,
            mediaCompany: applied.mediaCompany,
            site: applied.site,
            // null을 문자열 "null"로 변환하여 API에 전송 (일반 카테고리)
            categoryIds: applied.categoryIds?.map((id: number | null) => id === null ? "null" : id),
            noteContent: applied.noteContent,
            // 신청시간: 둘 다 있을 때만 API 쿼리에 포함
            applicationDateFrom:
              applied.applicationDateFrom && applied.applicationDateTo
                ? applied.applicationDateFrom
                : undefined,
            applicationDateTo:
              applied.applicationDateFrom && applied.applicationDateTo
                ? applied.applicationDateTo
                : undefined,
            assignedAtFrom: applied.assignedAtFrom,
            assignedAtTo: applied.assignedAtTo,
            keyword: applied.keyword,
            ipAddress: applied.ipAddress,
            notablePoints: applied.notablePoints,
            summaryInfo: applied.summaryInfo,
            sortType: applied.sortType,
            sortOrder: applied.sortOrder,
          }
        : null,
    [projectId, isRestoreReady, applied]
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
    setIf("assignType", filterValues.assignType);
    setIf("filterByLatestCategory", filterValues.filterByLatestCategory ?? true);
    setIf("apiKeyId", filterValues.apiKeyId);
    setIf("projectPartnerId", filterValues.projectPartnerId);
    setIf("teamId", filterValues.teamId);
    setIf("memberId", filterValues.memberId);
    setIf("applicationRoute", filterValues.applicationRoute);
    setIf("mediaCompany", filterValues.mediaCompany);
    setIf("site", filterValues.site);
    if (filterValues.categoryIds && filterValues.categoryIds.length) {
      filterValues.categoryIds.forEach((id) => {
        // null은 문자열 "null"로 변환하여 "일반" 카테고리를 나타냄
        params.append("categoryIds", id === null ? "null" : String(id));
      });
    }
    setIf("noteContent", filterValues.noteContent);
    // 신청시간: 둘 다 있을 때만 URL/쿼리에 포함
    if (filterValues.applicationDateFrom && filterValues.applicationDateTo) {
      setIf("applicationDateFrom", filterValues.applicationDateFrom);
      setIf("applicationDateTo", filterValues.applicationDateTo);
    }
    setIf("assignedAtFrom", filterValues.assignedAtFrom);
    setIf("assignedAtTo", filterValues.assignedAtTo);
    setIf("keyword", filterValues.keyword);
    setIf("ipAddress", filterValues.ipAddress);
    setIf("notablePoints", filterValues.notablePoints);
    setIf("summaryInfo", filterValues.summaryInfo);
    return params;
  }

  function applyFilters(filterValues?: CustomerFilters) {
    // Apply draft filters to URL; this triggers data fetching
    const valuesToApply = filterValues ?? filters;
    const params = buildFilterParams(valuesToApply);
    if (applied.sortType) params.set("sortType", applied.sortType);
    if (applied.sortOrder) params.set("sortOrder", applied.sortOrder);
    router.push(`/customers?${params.toString()}`);
  }

  function toggleSort(column: CustomerSortType) {
    const currentType = applied.sortType as CustomerSortType | undefined;
    const currentOrder = applied.sortOrder as CustomerSortOrder | undefined;
    const params = new URLSearchParams(searchParams?.toString());

    if (currentType !== column) {
      params.set("sortType", column);
      params.set("sortOrder", "DESC");
    } else if (currentOrder === "DESC") {
      params.set("sortOrder", "ASC");
    } else {
      params.delete("sortType");
      params.delete("sortOrder");
    }

    params.set("page", "1");
    params.set("limit", String(applied.limit || limit));
    router.push(`/customers?${params.toString()}`, { scroll: false });
  }

  function removeFilter(key: keyof CustomerFilters) {
    setFilters((f) => ({ ...f, [key]: undefined }));
  }

  function removeCategoryFilter(id: number | null) {
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

  function removeCategoryFilterAndApply(id: number | null) {
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
    sortType: applied.sortType as CustomerSortType | undefined,
    sortOrder: applied.sortOrder as CustomerSortOrder | undefined,
    toggleSort,
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

