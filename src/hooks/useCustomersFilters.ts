import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomersListQuery } from "@/types/customers";
import { sanitizeContactFilterInput } from "@/utils/format";

const CUSTOMER_FILTER_STORAGE_KEY_PREFIX = "tg_customers_last_filters";
const PERSISTABLE_FILTER_KEYS: (keyof CustomerFilters)[] = [
  "name",
  "contact1",
  "contact2",
  "assignType",
  "apiKeyId",
  "projectPartnerId",
  "teamId",
  "memberIds",
  "applicationRoute",
  "mediaCompany",
  "site",
  "categoryIds",
  "noteContent",
  "applicationDateFrom",
  "applicationDateTo",
  "assignedAtFrom",
  "assignedAtTo",
  "lastNoteDateFrom",
  "lastNoteDateTo",
  "hasNote",
  "keyword",
  "ipAddress",
  "salesMemo",
];

export type CustomerFilters = {
  name?: string;
  contact1?: string;
  contact2?: string;
  assignType?: "all" | "assigned" | "unassigned";
  apiKeyId?: number;
  projectPartnerId?: number;
  teamId?: number;
  memberIds?: number[];
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: (number | null)[];
  noteContent?: string;
  applicationDateFrom?: string;
  applicationDateTo?: string;
  assignedAtFrom?: string;
  assignedAtTo?: string;
  lastNoteDateFrom?: string;
  lastNoteDateTo?: string;
  /** true=메모 있는 고객, false=메모 없는 고객, undefined=전체 */
  hasNote?: boolean;
  keyword?: string;
  ipAddress?: string;
  salesMemo?: string;
};
export type CustomerSortType = "applicationDate" | "assignedMember" | "lastNoteDate" | "category";
export type CustomerSortOrder = "ASC" | "DESC";

export type DateRangeFilterType = "application" | "assigned" | "lastNote";

const DATE_RANGE_FILTER_KEYS: Record<DateRangeFilterType, [keyof CustomerFilters, keyof CustomerFilters]> = {
  application: ["applicationDateFrom", "applicationDateTo"],
  assigned: ["assignedAtFrom", "assignedAtTo"],
  lastNote: ["lastNoteDateFrom", "lastNoteDateTo"],
};

function emptyDateRange(type: DateRangeFilterType): CustomerFilters {
  const [fromKey, toKey] = DATE_RANGE_FILTER_KEYS[type];
  return { [fromKey]: undefined, [toKey]: undefined };
}

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

    if (typeof value === "boolean") {
      persistedFilters[key] = value as never;
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

    // 단일 담당자(memberId) 시절 저장값을 memberIds로 옮긴다.
    const legacyMemberId = (parsed as { memberId?: unknown }).memberId;
    if (typeof legacyMemberId === "number" && !Array.isArray(parsed.memberIds)) {
      parsed.memberIds = [legacyMemberId];
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
    obj.apiKeyId = gi("apiKeyId");
    obj.projectPartnerId = gi("projectPartnerId");
    obj.teamId = gi("teamId");
    {
      // 이전 URL(memberId=)도 그대로 열리도록 memberIds에 합친다.
      const ids = [...searchParams.getAll("memberIds"), ...searchParams.getAll("memberId")]
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);
      obj.memberIds = ids.length ? [...new Set(ids)] : undefined;
    }
    obj.applicationRoute = g("applicationRoute");
    obj.mediaCompany = g("mediaCompany");
    obj.site = g("site");
    obj.categoryIds = ga("categoryIds");
    obj.applicationDateFrom = g("applicationDateFrom");
    obj.applicationDateTo = g("applicationDateTo");
    obj.assignedAtFrom = g("assignedAtFrom");
    obj.assignedAtTo = g("assignedAtTo");
    obj.lastNoteDateFrom = g("lastNoteDateFrom");
    obj.lastNoteDateTo = g("lastNoteDateTo");
    {
      const rawHasNote = g("hasNote");
      obj.hasNote = rawHasNote === "true" ? true : rawHasNote === "false" ? false : undefined;
    }
    obj.keyword = g("keyword");
    obj.ipAddress = g("ipAddress");
    obj.salesMemo = g("salesMemo");
    const rawSortType = g("sortType");
    const rawSortOrder = g("sortOrder");
    obj.sortType =
      rawSortType === "applicationDate" ||
      rawSortType === "assignedMember" ||
      rawSortType === "lastNoteDate" ||
      rawSortType === "category"
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

  const buildFilterParams = useCallback((filterValues: CustomerFilters): URLSearchParams => {
    const params = new URLSearchParams();
    function setIf(key: string, val?: any) {
      if (val !== undefined && val !== null && val !== "") params.set(key, String(val));
    }
    setIf("page", 1);
    setIf("limit", limit);
    setIf("name", filterValues.name);
    setIf("contact1", filterValues.contact1);
    setIf("contact2", filterValues.contact2);
    setIf("assignType", filterValues.assignType);
    setIf("apiKeyId", filterValues.apiKeyId);
    setIf("projectPartnerId", filterValues.projectPartnerId);
    setIf("teamId", filterValues.teamId);
    filterValues.memberIds?.forEach((id) => params.append("memberIds", String(id)));
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
    setIf("lastNoteDateFrom", filterValues.lastNoteDateFrom);
    setIf("lastNoteDateTo", filterValues.lastNoteDateTo);
    setIf("hasNote", filterValues.hasNote);
    setIf("keyword", filterValues.keyword);
    setIf("ipAddress", filterValues.ipAddress);
    setIf("salesMemo", filterValues.salesMemo);
    return params;
  }, [limit]);

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
  }, [buildFilterParams, projectId, router, searchParams]);

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
        contact2: applied.contact2,
        assignType: applied.assignType,
        apiKeyId: applied.apiKeyId,
        projectPartnerId: applied.projectPartnerId,
        teamId: applied.teamId,
        memberIds: applied.memberIds,
        applicationRoute: applied.applicationRoute,
        mediaCompany: applied.mediaCompany,
        site: applied.site,
        categoryIds: applied.categoryIds,
        noteContent: applied.noteContent,
        applicationDateFrom: applied.applicationDateFrom,
        applicationDateTo: applied.applicationDateTo,
        assignedAtFrom: applied.assignedAtFrom,
        assignedAtTo: applied.assignedAtTo,
        lastNoteDateFrom: applied.lastNoteDateFrom,
        lastNoteDateTo: applied.lastNoteDateTo,
        hasNote: applied.hasNote,
        keyword: applied.keyword,
        ipAddress: applied.ipAddress,
        salesMemo: applied.salesMemo,
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
            contact2: applied.contact2,
            assignType: applied.assignType,
            apiKeyId: applied.apiKeyId,
            projectPartnerId: applied.projectPartnerId,
            teamId: applied.teamId,
            memberIds: applied.memberIds,
            applicationRoute: applied.applicationRoute,
            mediaCompany: applied.mediaCompany,
            site: applied.site,
            // null을 문자열 "null"로 변환하여 API에 전송
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
            lastNoteDateFrom: applied.lastNoteDateFrom,
            lastNoteDateTo: applied.lastNoteDateTo,
            hasNote: applied.hasNote,
            keyword: applied.keyword,
            ipAddress: applied.ipAddress,
            salesMemo: applied.salesMemo,
            sortType: applied.sortType,
            sortOrder: applied.sortOrder,
          }
        : null,
    [projectId, isRestoreReady, applied]
  );

  // Keep URL in sync for pagination/limit so data fetching follows
  function pushPage(nextPage: number, nextLimit?: number) {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("filterByLatestCategory");
    params.set("page", String(nextPage));
    params.set("limit", String(nextLimit ?? limit));
    router.push(`/customers?${params.toString()}`, { scroll: false });
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
    params.delete("filterByLatestCategory");

    // 이름순(카테고리)은 가나다순부터, 그 외(날짜 등)는 최신순부터 시작한다.
    const firstOrder: CustomerSortOrder = column === "category" ? "ASC" : "DESC";
    if (currentType !== column) {
      params.set("sortType", column);
      params.set("sortOrder", firstOrder);
    } else if (currentOrder === firstOrder) {
      params.set("sortOrder", firstOrder === "ASC" ? "DESC" : "ASC");
    } else {
      params.delete("sortType");
      params.delete("sortOrder");
    }

    params.set("page", "1");
    params.set("limit", String(applied.limit || limit));
    router.push(`/customers?${params.toString()}`, { scroll: false });
  }

  /** 정렬 기준/방향을 지정한다. column이 null이면 기본 정렬로 되돌린다. */
  function setSort(column: CustomerSortType | null, order: CustomerSortOrder = "DESC") {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("filterByLatestCategory");

    if (column) {
      params.set("sortType", column);
      params.set("sortOrder", order);
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

  function removeDateRangeFilter(type: DateRangeFilterType) {
    setFilters((f) => ({ ...f, ...emptyDateRange(type) }));
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

  function removeDateRangeFilterAndApply(type: DateRangeFilterType) {
    const updated = { ...filters, ...emptyDateRange(type) };
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
    setSort,
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

