"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FakeProgressStage = {
  /** 이 단계가 시작되는 진행률(%). from 오름차순으로 정렬되어 있어야 한다. */
  from: number;
  label: string;
};

export type FakeProgressConfig = {
  /** 진행률 상한(%). 완료 신호 전까지 이 값에 수학적으로 도달하지 않는다. */
  cap: number;
  /** 시상수(ms). 클수록 곡선이 완만해진다. */
  tau: number;
  /** 이 경과시간을 넘기면 isOverrunning이 true가 된다(ms). */
  overrunAfter: number;
  stages: FakeProgressStage[];
};

/** 응답이 아무리 빨라도 이 시간만큼은 노출해 0 → 100 섬광을 막는다. */
const MIN_VISIBLE_MS = 800;
const SETTLE_BASE_MS = 350;
const SETTLE_MS_PER_PERCENT = 5;
const SETTLE_MAX_MS = 800;
/** 100% 도달 후 화면 전환까지의 여운. */
const SETTLE_HOLD_MS = 250;
/**
 * 상태 갱신 최소 단위(%).
 *
 * 표시는 정수 퍼센트이고 막대 width도 같은 정수에서 뽑으므로(둘이 어긋나면 안 된다),
 * 그보다 잘게 갱신해봐야 화면은 그대로인 채 렌더만 늘어난다. 1%로 두면 표시값이 1 오를 때
 * 정확히 한 번 갱신된다 — 전 구간 통틀어 약 100회.
 *
 * 계단을 CSS 트랜지션으로 메우려는 시도는 하지 말 것: 숫자는 state를 즉시 반영하는데
 * 막대만 지연돼 눈에 띄게 어긋난다(특히 초당 ~100%로 움직이는 마무리 채우기 구간).
 */
const PERCENT_STEP = 1;

/**
 * 서버가 진행 신호를 주지 않는 장시간 작업용 추정 진행률.
 *
 * p(t) = cap × (1 − e^(−t/tau))
 *
 * 누적 가산(setInterval로 percent += n) 대신 경과시간의 순수 함수로 두는 이유:
 * 타이머 드리프트가 없고, 백그라운드 탭 스로틀 이후 복귀해도 값이 어긋나지 않으며,
 * 시간만 주입하면 그대로 검증할 수 있다.
 */
export function progressAt(elapsedMs: number, cap: number, tau: number): number {
  if (elapsedMs <= 0) return 0;
  return cap * (1 - Math.exp(-elapsedMs / tau));
}

export function stageLabelAt(percent: number, stages: FakeProgressStage[]): string {
  let label = stages[0]?.label ?? "";
  for (const stage of stages) {
    if (percent < stage.from) break;
    label = stage.label;
  }
  return label;
}

type UseFakeProgressOptions = {
  active: boolean;
  config: FakeProgressConfig;
  /** 경과시간 배속. 테스트 페이지 전용이며 실사용은 1. */
  speed?: number;
};

export type FakeProgressState = {
  percent: number;
  stageLabel: string;
  isOverrunning: boolean;
  isSettled: boolean;
  /** 100%까지 채우고 여운까지 끝나면 resolve. 화면 전환은 이걸 await한 뒤에 한다. */
  settle: () => Promise<void>;
  /** 실패 경로. 100%를 채우지 않고 즉시 중단한다. */
  abort: () => void;
};

export function useFakeProgress({
  active,
  config,
  speed = 1,
}: UseFakeProgressOptions): FakeProgressState {
  const [percent, setPercent] = useState(0);
  const [isOverrunning, setIsOverrunning] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // 매 렌더 최신값을 담아두고 루프는 ref만 읽는다. config가 인라인 객체여도
  // 루프가 재시작되지 않으면서 tau 같은 값은 즉시 반영된다(테스트 페이지 슬라이더).
  const configRef = useRef(config);
  configRef.current = config;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const percentRef = useRef(0);
  const startedAtRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const settlingRef = useRef(false);
  const settlePromiseRef = useRef<Promise<void> | null>(null);

  const clearScheduled = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 단조 증가 보장 + 양자화. 되돌아가는 진행률만큼 신뢰를 깎는 것도 없다.
  const advanceTo = useCallback((next: number) => {
    const clamped = Math.min(100, Math.max(percentRef.current, next));
    if (clamped < 100 && clamped - percentRef.current < PERCENT_STEP) return;
    percentRef.current = clamped;
    setPercent(clamped);
  }, []);

  useEffect(() => {
    if (!active) {
      clearScheduled();
      settlingRef.current = false;
      settlePromiseRef.current = null;
      percentRef.current = 0;
      setPercent(0);
      setIsOverrunning(false);
      setIsSettled(false);
      return;
    }

    startedAtRef.current = performance.now();

    const tick = () => {
      const { cap, tau, overrunAfter } = configRef.current;
      const elapsed = (performance.now() - startedAtRef.current) * speedRef.current;
      advanceTo(progressAt(elapsed, cap, tau));
      setIsOverrunning(elapsed >= overrunAfter);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return clearScheduled;
  }, [active, advanceTo, clearScheduled]);

  const settle = useCallback(() => {
    if (settlingRef.current && settlePromiseRef.current) return settlePromiseRef.current;
    settlingRef.current = true;

    const promise = new Promise<void>((resolve) => {
      const fill = () => {
        clearScheduled();
        const from = percentRef.current;
        const distance = Math.max(0, 100 - from);
        // 남은 거리에 비례. 45%에서 끝난 건이 뚝 끊기지 않고, 93%에서 끝난 건이 늘어지지 않게.
        const duration = Math.min(
          SETTLE_MAX_MS,
          SETTLE_BASE_MS + distance * SETTLE_MS_PER_PERCENT
        );
        const fillStartedAt = performance.now();

        const step = () => {
          const t = Math.min(1, (performance.now() - fillStartedAt) / duration);
          advanceTo(from + distance * (1 - (1 - t) ** 3));
          if (t < 1) {
            frameRef.current = requestAnimationFrame(step);
            return;
          }
          frameRef.current = null;
          setIsSettled(true);
          timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            resolve();
          }, SETTLE_HOLD_MS);
        };
        frameRef.current = requestAnimationFrame(step);
      };

      // 최소 노출시간을 못 채웠으면 그동안은 곡선을 계속 굴린 채로 기다린다.
      const remainingMinimum = MIN_VISIBLE_MS - (performance.now() - startedAtRef.current);
      if (remainingMinimum > 0) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          fill();
        }, remainingMinimum);
        return;
      }
      fill();
    });

    settlePromiseRef.current = promise;
    return promise;
  }, [advanceTo, clearScheduled]);

  const abort = useCallback(() => {
    clearScheduled();
    settlingRef.current = false;
    settlePromiseRef.current = null;
    setIsSettled(false);
  }, [clearScheduled]);

  return {
    percent,
    stageLabel: stageLabelAt(percent, config.stages),
    isOverrunning,
    isSettled,
    settle,
    abort,
  };
}
