"use client";

import { useImperativeHandle, type RefObject } from "react";
import { useFakeProgress } from "@/hooks/useFakeProgress";
import AnalysisLoadingOverlay from "./AnalysisLoadingOverlay";
import { ANALYSIS_PROGRESS_CONFIG } from "./analysisProgress";

export type AnalysisProgressHandle = {
  /** 100%까지 채우고 여운까지 끝나면 resolve. 화면 전환은 이걸 await한 뒤에 한다. */
  settle: () => Promise<void>;
  /** 실패 경로. 100%를 채우지 않고 즉시 중단한다. */
  abort: () => void;
};

type AnalysisLoadingOverlayHostProps = {
  active: boolean;
  ref?: RefObject<AnalysisProgressHandle | null>;
};

/**
 * 진행률 상태를 이 컴포넌트 안에 가둬 두는 렌더 경계.
 *
 * 진행률은 초당 수십 번 갱신되는데, 이 훅을 폼 컴포넌트에서 직접 호출하면 분석 대기 내내
 * 폼 트리 전체가 같은 빈도로 리렌더된다(최장 58초 기준 수천 회). 부모는 active가 바뀔 때만
 * 리렌더되고, 잦은 갱신은 오버레이 안에서만 돌게 한다.
 *
 * ref는 항상 존재해야 하므로 이 컴포넌트는 조건부로 렌더하지 말고 active로만 제어할 것.
 */
export default function AnalysisLoadingOverlayHost({
  active,
  ref,
}: AnalysisLoadingOverlayHostProps) {
  const progress = useFakeProgress({ active, config: ANALYSIS_PROGRESS_CONFIG });
  const { settle, abort } = progress;

  useImperativeHandle(ref, () => ({ settle, abort }), [settle, abort]);

  if (!active) return null;

  return (
    <AnalysisLoadingOverlay
      percent={progress.percent}
      stageLabel={progress.stageLabel}
      isOverrunning={progress.isOverrunning}
      isSettled={progress.isSettled}
    />
  );
}
