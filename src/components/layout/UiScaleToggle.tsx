"use client";

import { useEffect, useState } from "react";

type UiScaleMode = "normal" | "compact";

const STORAGE_KEY = "tg-ui-scale-mode";

function applyScale(mode: UiScaleMode) {
  if (typeof document === "undefined") return;

  const body = document.body;

  if (mode === "compact") {
    // 크롬/엣지 등에서 우선적으로 zoom 사용
    (body.style as any).zoom = "0.8";

    // zoom을 지원하지 않는 브라우저용 폴백
    if (!(("zoom" in (body.style as any)) as any)) {
      body.style.transform = "scale(0.8)";
      body.style.transformOrigin = "top left";
      body.style.minHeight = "125vh";
    }
  } else {
    // 기본 모드로 복원
    (body.style as any).zoom = "";
    body.style.transform = "";
    body.style.transformOrigin = "";
    body.style.minHeight = "";
  }
}

export default function UiScaleToggle() {
  const [mode, setMode] = useState<UiScaleMode>("normal");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as UiScaleMode | null;
      const initial: UiScaleMode = saved === "compact" || saved === "normal" ? saved : "normal";
      setMode(initial);
      applyScale(initial);
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (next: UiScaleMode) => {
    setMode(next);
    applyScale(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  // 헤더 바로 아래, 우상단에 고정된 체험용 토글
  return (
    <div className="fixed top-[64px] right-6 z-[40] pointer-events-none">
      <div className="inline-flex items-center gap-2 rounded-full bg-black/60 text-white px-3 py-1 text-[11px] leading-[14px] pointer-events-auto shadow-sm">
        <span className="opacity-80">화면 크기</span>
        <div className="flex rounded-full bg-black/40 p-[2px] gap-[2px]">
          <button
            type="button"
            onClick={() => handleChange("normal")}
            className={`px-2 h-[20px] rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
              mode === "normal" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"
            }`}
          >
            기존모드
          </button>
          <button
            type="button"
            onClick={() => handleChange("compact")}
            className={`px-2 h-[20px] rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
              mode === "compact" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"
            }`}
          >
            컴팩트모드
          </button>
        </div>
      </div>
    </div>
  );
}


