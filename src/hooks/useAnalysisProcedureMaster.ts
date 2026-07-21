"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalysisService } from "@/services/analysis";
import { PROCEDURE_FROM_ANALYSIS } from "@/services/debtRelief";
import {
  PROCEDURE_PROGRESS_STEP_TITLES,
  type ProcedureStepTitlesByProcedure,
} from "@/types/debtRelief";

// 절차 마스터 데이터는 로그인 토큰과 동일한 24시간 생명주기로 캐싱한다 — 거의 바뀌지 않는 값이라
// 매 마운트마다 다시 불러올 필요가 없다.
const PROCEDURE_MASTER_STALE_TIME = 24 * 60 * 60 * 1000;
const PROCEDURE_MASTER_GC_TIME = 25 * 60 * 60 * 1000;

export const analysisProcedureMasterKeys = {
  byProject: (projectId: string | null) => ["analysis", "procedures", projectId] as const,
};

async function fetchStepTitlesByProcedure(
  projectId: string
): Promise<ProcedureStepTitlesByProcedure> {
  const response = await AnalysisService.procedures(projectId);
  const masters = response.data.data;

  // 하드코딩 폴백을 베이스로 두고 실 데이터로 덮어써서, 백엔드가 특정 절차를 응답에서
  // 빠뜨려도(예: 아직 개편 전) 나머지 절차는 정상 값을 유지한다.
  const result: ProcedureStepTitlesByProcedure = { ...PROCEDURE_PROGRESS_STEP_TITLES };
  for (const master of masters) {
    const key = PROCEDURE_FROM_ANALYSIS[master.procedure];
    result[key] = master.steps.map((step) => step.title);
  }
  return result;
}

/**
 * 절차별 단계명 마스터 데이터(GET /v1/analysis/procedures). 목록 화면의 "진행단계"(n/m) 표시에 쓰인다.
 * 로딩 중이거나 요청이 실패하면 하드코딩 폴백(PROCEDURE_PROGRESS_STEP_TITLES)을 그대로 반환해
 * 목록 렌더링이 깨지지 않는다.
 */
export function useAnalysisProcedureMaster(projectId: string | null) {
  const query = useQuery({
    queryKey: analysisProcedureMasterKeys.byProject(projectId),
    queryFn: () => fetchStepTitlesByProcedure(projectId as string),
    enabled: Boolean(projectId),
    staleTime: PROCEDURE_MASTER_STALE_TIME,
    gcTime: PROCEDURE_MASTER_GC_TIME,
    retry: 1,
  });

  return {
    stepTitlesByProcedure: query.data ?? PROCEDURE_PROGRESS_STEP_TITLES,
    loading: query.isLoading,
  };
}
