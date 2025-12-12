"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const COMPACT_ZOOM = 0.8;

type UiScaleMode = "normal" | "compact";

function applyScale(mode: UiScaleMode) {
  if (typeof document === "undefined") return;

  const body = document.body;

  if (mode === "compact") {
    // 크롬/엣지 등에서 우선적으로 zoom 사용
    (body.style as any).zoom = String(COMPACT_ZOOM);

    // zoom을 지원하지 않는 브라우저용 폴백
    if (!(("zoom" in (body.style as any)) as any)) {
      body.style.transform = `scale(${COMPACT_ZOOM})`;
      body.style.transformOrigin = "top left";
      body.style.minHeight = `${Math.round((1 / COMPACT_ZOOM) * 100)}vh`;
    }
    return;
  }

  // 기본 모드로 복원
  (body.style as any).zoom = "";
  body.style.transform = "";
  body.style.transformOrigin = "";
  body.style.minHeight = "";
}

export default function UiScaleToggle() {
  const isDev = useMemo(() => process.env.NODE_ENV === "development", []);
  const searchParams = useSearchParams();
  const uiScaleParam = searchParams.get("uiScale");

  useEffect(() => {
    // 기본은 항상 compact.
    // 개발 환경에서만 ?uiScale=normal|compact 로 오버라이드 허용.
    const mode: UiScaleMode =
      isDev && (uiScaleParam === "normal" || uiScaleParam === "compact")
        ? uiScaleParam
        : "compact";

    applyScale(mode);
  }, [isDev, uiScaleParam]);

  // UI는 렌더링하지 않음 (배포 페이지 노출 방지)
  return null;
}


