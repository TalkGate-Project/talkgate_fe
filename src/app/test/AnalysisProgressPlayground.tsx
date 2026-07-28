"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnalysisLoadingOverlay from "@/components/debt-relief/form/AnalysisLoadingOverlay";
import { ANALYSIS_PROGRESS_CONFIG } from "@/components/debt-relief/form/analysisProgress";
import { progressAt, stageLabelAt, useFakeProgress } from "@/hooks/useFakeProgress";

const SCENARIOS = [
  { label: "10초 (관측 최단)", ms: 10_000 },
  { label: "30초 (중간)", ms: 30_000 },
  { label: "58초 (관측 최장)", ms: 58_000 },
  { label: "70초 (오버런)", ms: 70_000 },
] as const;

const SPEEDS = [1, 5, 10] as const;
const CURVE_SAMPLE_SECONDS = [5, 10, 20, 30, 45, 58, 70];

const controlButtonClass =
  "px-3 py-1.5 text-sm rounded border border-neutral-30 text-neutral-70 dark:text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-20 disabled:opacity-40 disabled:cursor-not-allowed";

/**
 * 분석 진행률 오버레이 검증용. 실제 API는 10~58초가 걸려 실시간으로는 튜닝이 어렵기 때문에
 * 배속과 tau 슬라이더로 곡선을 흔들어보고, 수동 슬라이더로 UI만 따로 확인한다.
 */
export default function AnalysisProgressPlayground() {
  const [running, setRunning] = useState(false);
  // 기본값은 1x. 배속은 곡선(경과시간)에만 걸리고 마무리 채우기는 실시간이라,
  // 배속 상태에서는 마무리 연출이 실제보다 길게 느껴진다.
  const [speed, setSpeed] = useState<number>(1);
  const [tau, setTau] = useState(ANALYSIS_PROGRESS_CONFIG.tau);
  const [elapsed, setElapsed] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPercent, setManualPercent] = useState(45);
  const [manualSettled, setManualSettled] = useState(false);
  const [manualOverrun, setManualOverrun] = useState(false);

  const scenarioTimerRef = useRef<number | null>(null);
  const config = { ...ANALYSIS_PROGRESS_CONFIG, tau };
  const progress = useFakeProgress({ active: running, config, speed });
  // progress 객체는 매 렌더 새로 생기므로 안정적인 두 함수만 뽑아 콜백 의존성으로 쓴다.
  const { settle, abort } = progress;

  const clearScenarioTimer = useCallback(() => {
    if (scenarioTimerRef.current === null) return;
    clearTimeout(scenarioTimerRef.current);
    scenarioTimerRef.current = null;
  }, []);

  useEffect(() => clearScenarioTimer, [clearScenarioTimer]);

  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      setElapsed((performance.now() - startedAt) * speed);
    }, 100);
    return () => clearInterval(id);
  }, [running, speed]);

  const finishNow = useCallback(async () => {
    clearScenarioTimer();
    await settle();
    setRunning(false);
  }, [clearScenarioTimer, settle]);

  const failNow = useCallback(() => {
    clearScenarioTimer();
    abort();
    setRunning(false);
  }, [clearScenarioTimer, abort]);

  const runScenario = (durationMs: number | null) => {
    clearScenarioTimer();
    setRunning(true);
    if (durationMs === null) return;
    scenarioTimerRef.current = window.setTimeout(() => {
      scenarioTimerRef.current = null;
      void finishNow();
    }, durationMs / speed);
  };

  // 오버레이는 닫기 수단이 없는 화면이라 플레이그라운드에서만 Esc 탈출구를 둔다.
  useEffect(() => {
    if (!running && !manualOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (manualOpen) setManualOpen(false);
      if (running) failNow();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [running, manualOpen, failNow]);

  return (
    <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-neutral-70 dark:text-neutral-50">
          <span className="font-semibold">컴포넌트:</span>{" "}
          <code className="bg-white dark:bg-neutral-20 px-1 rounded">
            @/components/debt-relief/form/AnalysisLoadingOverlay
          </code>{" "}
          +{" "}
          <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/hooks/useFakeProgress</code>
        </p>
        <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
          <span className="font-semibold">실제 사용 위치:</span>{" "}
          <code className="bg-white dark:bg-neutral-20 px-1 rounded">DiagnosisFormContent.tsx</code>{" "}
          — 진단 분석 생성/재분석 대기 화면
        </p>
        <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
          💡 서버가 진행 신호를 주지 않아 경과시간 기반 추정 진행률입니다. 오버레이가 떠 있는 동안
          Esc로 빠져나올 수 있습니다(테스트 전용).
        </p>
      </div>

      {/* 시나리오 */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-neutral-80 mb-2">시나리오</h3>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => runScenario(scenario.ms)}
              disabled={running}
              className={controlButtonClass}
            >
              {scenario.label}
              {speed !== 1 && (
                <span className="ml-1 opacity-60">
                  · 실제 {(scenario.ms / speed / 1000).toFixed(1)}초
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => runScenario(null)}
            disabled={running}
            className={controlButtonClass}
          >
            무한 (수동 종료)
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => void finishNow()}
            disabled={!running}
            className="px-3 py-1.5 text-sm rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            지금 완료 (100% 채우기)
          </button>
          <button
            onClick={failNow}
            disabled={!running}
            className="px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            실패 처리 (채우지 않고 중단)
          </button>
        </div>
      </div>

      {/* 파라미터 */}
      <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="block text-sm font-semibold text-neutral-70 dark:text-neutral-60 mb-2">
            배속 — 곡선에만 적용됩니다
          </span>
          <p className="text-xs text-neutral-60 dark:text-neutral-50 mb-2">
            마무리 채우기(약 0.4~0.8초)는 배속을 타지 않는 실제 UX 시간입니다. 마무리 연출을
            판단할 때는 1x로 보세요.
          </p>
          <div className="flex gap-2">
            {SPEEDS.map((value) => (
              <button
                key={value}
                onClick={() => setSpeed(value)}
                disabled={running}
                className={`${controlButtonClass} ${
                  speed === value ? "!bg-neutral-80 !text-white !border-neutral-80" : ""
                }`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor="analysis-progress-tau"
            className="block text-sm font-semibold text-neutral-70 dark:text-neutral-60 mb-2"
          >
            tau: {(tau / 1000).toFixed(1)}초 (기본{" "}
            {(ANALYSIS_PROGRESS_CONFIG.tau / 1000).toFixed(1)}초) — 클수록 완만
          </label>
          <input
            id="analysis-progress-tau"
            type="range"
            min={6000}
            max={32000}
            step={500}
            value={tau}
            onChange={(event) => setTau(Number(event.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* 실시간 readout */}
      <div className="mb-5 p-3 rounded-lg bg-neutral-10 dark:bg-neutral-20 font-mono text-sm text-neutral-80 dark:text-neutral-60">
        <div>
          elapsed : {(elapsed / 1000).toFixed(1)}초 (곡선 기준)
          {speed !== 1 && ` / 실제 ${(elapsed / speed / 1000).toFixed(1)}초`}
        </div>
        <div>
          percent : {progress.percent.toFixed(1)}% (오버레이 표시{" "}
          {Math.floor(progress.percent)}%)
        </div>
        <div>stage : {progress.stageLabel || "-"}</div>
        <div>overrun : {String(progress.isOverrunning)}</div>
        <div>settled : {String(progress.isSettled)}</div>
      </div>

      {/* 곡선 미리보기 */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-neutral-80 mb-2">
          현재 tau 기준 곡선
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-20 dark:bg-neutral-20 text-neutral-70 dark:text-neutral-60">
                <th className="text-left px-3 py-2 rounded-l-[6px] whitespace-nowrap">경과</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">진행률</th>
                <th className="text-left px-3 py-2 rounded-r-[6px]">단계</th>
              </tr>
            </thead>
            <tbody>
              {CURVE_SAMPLE_SECONDS.map((seconds) => {
                const percentAt = progressAt(seconds * 1000, config.cap, tau);
                return (
                  <tr
                    key={seconds}
                    className="border-b border-neutral-30/40 dark:!border-[#44444455]"
                  >
                    <td className="px-3 py-2 text-neutral-80 dark:text-neutral-60 whitespace-nowrap">
                      {seconds}초
                    </td>
                    <td className="px-3 py-2 font-semibold text-neutral-90 dark:text-neutral-70 whitespace-nowrap">
                      {percentAt.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-neutral-70 dark:text-neutral-60">
                      {stageLabelAt(percentAt, config.stages)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* UI만 수동 확인 */}
      <div className="pt-4 border-t border-neutral-30">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-neutral-80 mb-2">
          오버레이 UI 수동 확인
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-70 dark:text-neutral-60">
            percent
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={manualPercent}
              onChange={(event) => setManualPercent(Number(event.target.value))}
              className="w-48"
            />
            <span className="font-mono w-10">{manualPercent}%</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-70 dark:text-neutral-60">
            <input
              type="checkbox"
              checked={manualSettled}
              onChange={(event) => setManualSettled(event.target.checked)}
            />
            완료 문구
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-70 dark:text-neutral-60">
            <input
              type="checkbox"
              checked={manualOverrun}
              onChange={(event) => setManualOverrun(event.target.checked)}
            />
            오버런 문구
          </label>
          <button
            onClick={() => setManualOpen(true)}
            disabled={running}
            className={controlButtonClass}
          >
            오버레이 열기 (Esc로 닫기)
          </button>
        </div>
      </div>

      {running && (
        <AnalysisLoadingOverlay
          percent={progress.percent}
          stageLabel={progress.stageLabel}
          isOverrunning={progress.isOverrunning}
          isSettled={progress.isSettled}
        />
      )}

      {!running && manualOpen && (
        <AnalysisLoadingOverlay
          percent={manualPercent}
          stageLabel={stageLabelAt(manualPercent, config.stages)}
          isOverrunning={manualOverrun}
          isSettled={manualSettled}
        />
      )}
    </div>
  );
}
