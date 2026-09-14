"use client";

import { useEffect, useState } from "react";

const COUNT_UP_DURATION = 900;
const COUNT_UP_STAGGER = 160;
// 4개 지표가 전부 같은 길이·같은 간격으로 움직이면 한 덩어리로 딱딱 끊어 재생되는 것처럼
// 보인다. 시작 시점(지연)은 순서대로 보여주는 리듬을 위해 그대로 두되, 재생 길이는 항목마다
// 조금씩 달라 보이도록 미세하게 늘린다 — 값 자체엔 영향 없고 카운트업이 끝나는 타이밍만 서로
// 어긋난다.
const COUNT_UP_DURATION_STEP = 60;

export default function AnimatedBriefingAmount({
  value,
  index,
  maximumFractionDigits = 0,
}: {
  value: number;
  index: number;
  maximumFractionDigits?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let animationFrame = 0;
    let startedAt = 0;
    setDisplayValue(0);
    const duration = COUNT_UP_DURATION + index * COUNT_UP_DURATION_STEP;

    const delayTimer = window.setTimeout(() => {
      const updateValue = (now: number) => {
        if (startedAt === 0) startedAt = now;

        const progress = Math.min((now - startedAt) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(value * easedProgress);

        if (progress < 1) animationFrame = requestAnimationFrame(updateValue);
      };

      animationFrame = requestAnimationFrame(updateValue);
    }, index * COUNT_UP_STAGGER);

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(animationFrame);
    };
  }, [index, value]);

  return <>{displayValue.toLocaleString("ko-KR", { maximumFractionDigits })}</>;
}
