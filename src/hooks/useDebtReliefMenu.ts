"use client";

import { useProjectType } from "@/hooks/useProjectType";

/**
 * 회생·파산 메뉴 표시 여부.
 * analysis(영업) / lawyer(변호사) 프로젝트에서만 true.
 */
export function useDebtReliefMenu() {
  const { isDebtRelief, ready } = useProjectType();
  return [isDebtRelief, ready] as const;
}
