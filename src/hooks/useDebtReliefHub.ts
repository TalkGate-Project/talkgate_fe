"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { DebtReliefService } from "@/services/debtRelief";
import type { AnalysisStatus } from "@/types/analysis";
import type {
  DiagnosisDetail,
  DiagnosisHubSummary,
  DiagnosisListItem,
  DiagnosisSortField,
  RecommendedProcedure,
  SortDirection,
} from "@/types/debtRelief";

// 대시보드 요약 카드 데이터 로딩.
// DebtReliefService.getHubSummary → GET /v1/analysis/summary.
export function useDebtReliefSummary() {
  const [projectId, ready] = useSelectedProjectId();
  const [summary, setSummary] = useState<DiagnosisHubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!ready || !projectId) return;

    let cancelled = false;
    setLoading(true);

    DebtReliefService.getHubSummary(projectId)
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load debt-relief hub summary:", err);
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, ready]);

  return { summary, loading, error };
}

export const DEBT_RELIEF_PAGE_LIMIT = 10;

export type DiagnosisListTab = "all" | "rejected";

// 진단 목록 상태(탭/검색/정렬/페이지) + 서비스 호출.
// 검색은 실시간(타이핑 디바운스)이 아니라 Enter 또는 검색 버튼 클릭으로만 실행된다
// (appliedKeyword가 실제 쿼리에 쓰이는 값이고 keyword는 입력창 표시용).
// 필터/정렬/검색 제출이 바뀌면 1페이지로 되돌린다.
// 정렬은 GET /v1/analysis의 sortType/sortOrder로 서버에 위임한다(현재 consultationDate만 지원).
// 목록 탭: 전체=status 미지정(서버가 rejected 제외), 반려=status=rejected.
//
// 상태를 URL 쿼리스트링에도 동기화한다 — 상세 페이지로 이동했다가 브라우저 "뒤로가기"로
// 돌아오면 이 훅이 완전히 새로 마운트되면서(다른 라우트라 언마운트됨) 순수 useState만으로는
// 검색어/필터/페이지가 전부 초기화되던 문제(§3-E 회귀) 때문. 고객목록의 useCustomersFilters와
// 같은 방향이되, 여기선 뒤로가기 복원만이 목적이라 로컬스토리지 복원 레이어는 가져오지 않는다.
export function useDebtReliefList() {
  const [projectId, ready] = useSelectedProjectId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listTab, setListTabState] = useState<DiagnosisListTab>(
    () => (searchParams.get("listTab") === "rejected" ? "rejected" : "all")
  );
  const [procedure, setProcedureState] = useState<RecommendedProcedure | undefined>(
    () => (searchParams.get("procedure") as RecommendedProcedure) || undefined
  );
  const [status, setStatusState] = useState<AnalysisStatus | undefined>(
    () => (searchParams.get("status") as AnalysisStatus) || undefined
  );
  const [keyword, setKeyword] = useState(() => searchParams.get("keyword") || "");
  const [appliedKeyword, setAppliedKeyword] = useState(() => searchParams.get("keyword") || "");
  // 서버가 내부적으로 기본 정렬을 가지고 있어 프론트에서 상담일 기본 정렬을 명시적으로 보내지
  // 않는다(전에는 여기서 "consultedAt" 기본값을 줬었음 — 백엔드 기본 정렬과 이중으로 겹쳤었다).
  const [sortField, setSortField] = useState<DiagnosisSortField | undefined>(
    () => (searchParams.get("sortField") as DiagnosisSortField) || undefined
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => (searchParams.get("sortDirection") as SortDirection) || "desc"
  );
  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
  const [limit, setLimitState] = useState(
    () => Number(searchParams.get("limit")) || DEBT_RELIEF_PAGE_LIMIT
  );
  const [refetchIndex, setRefetchIndex] = useState(0);

  // 위 상태들이 바뀔 때마다 현재 URL의 쿼리스트링을 갱신(히스토리 replace, 스크롤 유지) —
  // 나중에 상세로 갔다가 뒤로가기로 돌아왔을 때 이 값을 그대로 복원할 수 있도록.
  useEffect(() => {
    const params = new URLSearchParams();
    if (listTab === "rejected") params.set("listTab", "rejected");
    if (procedure) params.set("procedure", procedure);
    if (status) params.set("status", status);
    if (appliedKeyword) params.set("keyword", appliedKeyword);
    if (sortField) {
      params.set("sortField", sortField);
      params.set("sortDirection", sortDirection);
    }
    if (page > 1) params.set("page", String(page));
    if (limit !== DEBT_RELIEF_PAGE_LIMIT) params.set("limit", String(limit));
    const queryString = params.toString();
    router.replace(queryString ? `/debt-relief?${queryString}` : "/debt-relief", { scroll: false });
  }, [listTab, procedure, status, appliedKeyword, sortField, sortDirection, page, limit, router]);

  const [items, setItems] = useState<DiagnosisListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const selectListTab = (next: DiagnosisListTab) => {
    setListTabState(next);
    // 반려 탭은 status=rejected 전용 — 필터 모달의 상태 선택은 해제한다.
    if (next === "rejected") {
      setStatusState(undefined);
    }
    setPage(1);
  };

  const selectProcedure = (next: RecommendedProcedure | undefined) => {
    setProcedureState(next);
    setPage(1);
  };

  const selectStatus = (next: AnalysisStatus | undefined) => {
    setStatusState(next);
    setPage(1);
  };

  const setLimit = (next: number) => {
    setLimitState(next);
    setPage(1);
  };

  // 오름차순 → 내림차순 → 정렬 해제 3단계로 순환한다.
  const toggleSort = (field: DiagnosisSortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortField(undefined);
    }
    setPage(1);
  };

  // Enter 또는 검색 버튼 클릭 시 호출 — 이 시점의 입력값을 실제 쿼리에 반영한다.
  const submitSearch = () => {
    setAppliedKeyword(keyword);
    setPage(1);
  };

  // 검색 입력창 X 버튼: 입력값과 적용된 검색어를 한 번에 초기화한다.
  // (setKeyword("") 후 곧바로 submitSearch를 부르면 keyword가 아직 갱신 전이라
  // 예전 값으로 검색되는 stale state 문제가 생겨 별도 함수로 둘 다 함께 처리한다.)
  const clearSearch = () => {
    setKeyword("");
    setAppliedKeyword("");
    setPage(1);
  };

  const refetch = useCallback(() => setRefetchIndex((prev) => prev + 1), []);

  // 반려 탭: status=rejected 고정. 전체 탭: 필터 상태(있으면)만 전달 — 미지정 시 서버가 rejected 제외.
  const queryStatus: AnalysisStatus | undefined =
    listTab === "rejected" ? "rejected" : status;

  useEffect(() => {
    if (!ready || !projectId) return;

    let cancelled = false;
    setLoading(true);

    DebtReliefService.listDiagnoses({
      projectId,
      page,
      limit,
      procedure,
      status: queryStatus,
      keyword: appliedKeyword,
      sortField,
      sortDirection,
    })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotalCount(result.totalCount);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load debt-relief diagnosis list:", err);
        setItems([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    ready,
    page,
    limit,
    procedure,
    queryStatus,
    appliedKeyword,
    sortField,
    sortDirection,
    refetchIndex,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    items,
    totalCount,
    loading,
    listTab,
    selectListTab,
    procedure,
    selectProcedure,
    status,
    selectStatus,
    keyword,
    setKeyword,
    submitSearch,
    clearSearch,
    sortField,
    sortDirection,
    toggleSort,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    refetch,
  };
}

// 진단 결과 상세 로딩
export function useDiagnosisDetail(id: string) {
  const [projectId, ready] = useSelectedProjectId();
  const [detail, setDetail] = useState<DiagnosisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);
  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !projectId || !id) return;

    let cancelled = false;
    if (loadedIdRef.current !== id) {
      setLoading(true);
    }

    DebtReliefService.getDiagnosisDetail(projectId, id)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setError(null);
        loadedIdRef.current = id;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load diagnosis detail:", err);
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, ready, id, refetchIndex]);

  // 고객 매칭/해제 등 상세 응답이 바뀌는 액션 후 다시 불러올 때 사용.
  const refetch = useCallback(() => setRefetchIndex((prev) => prev + 1), []);

  return { detail, loading, error, refetch };
}
