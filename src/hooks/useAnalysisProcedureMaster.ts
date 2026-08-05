"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalysisService } from "@/services/analysis";
import { normalizeProcedureType } from "@/types/analysis";
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
  // ⚠️ 우리 타입(AnalysisProceduresResponse)은 배열을 전제하지만, 2026-08-04 Swagger의
  // Schema 탭은 이 엔드포인트의 data를 배열 대괄호 없이 단일 AnalysisProcedureResponseDto로
  // 표기한다(비교: GET /v1/analysis의 items는 "[AnalysisListItemDto{...}]"로 배열이 명시됨).
  // 실제로 단일 객체가 온다면 아래 for...of가 "not iterable"로 즉시 크래시해 목록 화면
  // "진행단계" 컬럼 전체가 죽는다 — 백엔드에 배열 여부 확인 전까지 양쪽 다 방어한다.
  const raw = response.data.data;
  const masters = Array.isArray(raw) ? raw : [raw];

  // 하드코딩 폴백을 베이스로 두고 실 데이터로 덮어써서, 백엔드가 특정 절차를 응답에서
  // 빠뜨려도(예: 아직 개편 전) 나머지 절차는 정상 값을 유지한다.
  const result: ProcedureStepTitlesByProcedure = { ...PROCEDURE_PROGRESS_STEP_TITLES };
  for (const master of masters) {
    result[normalizeProcedureType(master.procedure)] = master.steps.map((step) => step.title);
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
