"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ANALYSIS_PROGRESS_DONE_LABEL,
  ANALYSIS_PROGRESS_HINT,
  ANALYSIS_PROGRESS_OVERRUN_HINT,
} from "./analysisProgress";

type AnalysisLoadingOverlayProps = {
  /** 0~100. 진행률 계산은 useFakeProgress가 담당하고 여기서는 그리기만 한다. */
  percent: number;
  stageLabel: string;
  isOverrunning: boolean;
  /** 실제 응답이 도착해 100%까지 채운 뒤인지. */
  isSettled: boolean;
};

/**
 * 분석 API 대기 중 전체 화면을 덮어 추가 입력을 막는다.
 * 에러 모달(z-280)보다 낮게 두어 실패 시 안내가 위에 뜨도록 한다.
 */
export default function AnalysisLoadingOverlay({
  percent,
  stageLabel,
  isOverrunning,
  isSettled,
}: AnalysisLoadingOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  // 막대 width·퍼센트 숫자·aria-valuenow가 모두 이 하나의 값에서 나와야 서로 어긋나지 않는다.
  // floor를 쓰는 이유: 반올림하면 99.7%에서 숫자만 먼저 100%가 돼 막대보다 앞서간다.
  const displayPercent = Math.floor(percent);
  const label = isSettled ? ANALYSIS_PROGRESS_DONE_LABEL : stageLabel;
  const hint = isOverrunning ? ANALYSIS_PROGRESS_OVERRUN_HINT : ANALYSIS_PROGRESS_HINT;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="analysis-loading-title"
      aria-describedby="analysis-loading-stage"
    >
      <div className="flex w-full max-w-[420px] flex-col items-center px-6 text-center">
        <h1 id="analysis-loading-title" className="typo-h2 text-foreground">
          분석 중
        </h1>
        <p
          id="analysis-loading-stage"
          aria-live="polite"
          className="mt-4 min-h-[24px] typo-body-2 text-foreground leading-[1.6]"
        >
          {label}
        </p>

        <div className="mt-8 w-full">
          <div
            role="progressbar"
            aria-valuenow={displayPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-full bg-neutral-20"
          >
            <div
              className="relative h-full overflow-hidden rounded-full bg-primary-60"
              style={{ width: `${displayPercent}%` }}
            >
              {/* 후반부에는 곡선이 초당 0.2% 미만으로 움직여 정지해 보인다.
                  진행을 암시하지 않으면서 동작 중이라는 신호만 주는 광택 스윕. */}
              <span className="absolute inset-0 animate-analysis-sheen" aria-hidden />
            </div>
          </div>
          <p className="mt-3 typo-body-2 font-semibold text-foreground tabular-nums" aria-hidden>
            {displayPercent}%
          </p>
        </div>

        <p className="mt-6 typo-caption-1 text-neutral-60">{hint}</p>

        <div className="mt-8 flex items-center gap-2" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 rounded-full bg-neutral-80 animate-analysis-dot"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
