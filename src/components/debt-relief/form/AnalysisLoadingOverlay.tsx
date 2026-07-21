"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * 분석 API 대기 중 전체 화면을 덮어 추가 입력을 막는다.
 * 에러 모달(z-280)보다 낮게 두어 실패 시 안내가 위에 뜨도록 한다.
 */
export default function AnalysisLoadingOverlay() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="analysis-loading-title"
      aria-describedby="analysis-loading-desc"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <h1 id="analysis-loading-title" className="typo-h2 text-foreground">
          분석 중
        </h1>
        <p
          id="analysis-loading-desc"
          className="mt-4 typo-body-2 text-neutral-60 leading-[1.6]"
        >
          수집된 정보를 바탕으로
          <br />
          개인회생·파산 가능성을 분석하고 있습니다.
        </p>
        <div className="mt-10 flex items-center gap-2" aria-hidden>
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
