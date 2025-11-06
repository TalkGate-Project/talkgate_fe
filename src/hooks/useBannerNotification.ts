"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Banner = { type: "success" | "error"; message: string } | null;

/**
 * 배너 알림을 관리하는 훅
 * 4초 후 자동으로 사라지도록 설정됨
 */
export function useBannerNotification() {
  const [banner, setBanner] = useState<Banner>(null);

  const showBanner = useCallback((type: "success" | "error", message: string) => {
    setBanner({ type, message });
  }, []);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  return { banner, showBanner };
}

