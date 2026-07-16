"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// 진단 목록 상태(탭/검색/정렬/페이지) + 서비스 호출.
// 검색은 실시간(타이핑 디바운스)이 아니라 Enter 또는 검색 버튼 클릭으로만 실행된다
// (appliedKeyword가 실제 쿼리에 쓰이는 값이고 keyword는 입력창 표시용).
// 필터/정렬/검색 제출이 바뀌면 1페이지로 되돌린다.
// 정렬은 GET /v1/analysis의 sortType/sortOrder로 서버에 위임한다(현재 consultationDate만 지원).
export function useDebtReliefList() {
  const [projectId, ready] = useSelectedProjectId();

  const [procedure, setProcedureState] = useState<RecommendedProcedure | undefined>(undefined);
  const [status, setStatusState] = useState<AnalysisStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [sortField, setSortField] = useState<DiagnosisSortField | undefined>("consultedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(DEBT_RELIEF_PAGE_LIMIT);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const [items, setItems] = useState<DiagnosisListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const toggleSort = (field: DiagnosisSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
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

  useEffect(() => {
    if (!ready || !projectId) return;

    let cancelled = false;
    setLoading(true);

    DebtReliefService.listDiagnoses({
      projectId,
      page,
      limit,
      procedure,
      status,
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
  }, [projectId, ready, page, limit, procedure, status, appliedKeyword, sortField, sortDirection, refetchIndex]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    items,
    totalCount,
    loading,
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
