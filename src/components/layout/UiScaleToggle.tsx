"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

const COMPACT_ZOOM = 0.8;
const MOBILE_BREAKPOINT = 1080; // 1280px 미만은 모바일/태블릿으로 간주하여 zoom 적용 안 함

type UiScaleMode = "normal" | "compact";

type Props = {
  initialZoom?: UiScaleMode;
};

function applyScale(mode: UiScaleMode) {
  if (typeof document === "undefined") return;

  const body = document.body;
  
  // 디버깅용 로그
  // console.log(`[UiScaleToggle] Applying scale: ${mode}, Path: ${window.location.pathname}`);

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

  // 기본 모드로 복원 (normal)
  // zoom = "" 대신 "1"을 명시적으로 설정하여 확실하게 리셋
  (body.style as any).zoom = "1";
  body.style.transform = "";
  body.style.transformOrigin = "";
  body.style.minHeight = "";
}

export default function UiScaleToggle({ initialZoom }: Props) {
  const isDev = useMemo(() => process.env.NODE_ENV === "development", []);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const uiScaleParam = searchParams.get("uiScale");
  
  // 화면 너비 상태 관리
  const [isSmallScreen, setIsSmallScreen] = useState<boolean | null>(null);

  useEffect(() => {
    // 초기 체크
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const isAuthPage = useMemo(() => {
    // pathname이 없을 경우(드물지만) 처리
    if (!pathname) return false;
    
    const authPaths = [
      "/login", 
      "/signup", 
      "/social-signup",
      "/project-signup", // 프로젝트 가입 페이지 (초대 플로우)
      "/forgot-password", 
      "/invite", 
      "/auth/callback",
      "/logout" // logout 페이지도 포함 (리다이렉트 전 잠시 보일 수 있음)
    ];
    return authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  }, [pathname]);

  useEffect(() => {
    // 1. 개발 환경에서 쿼리 파라미터로 강제 설정 (최우선)
    if (isDev && (uiScaleParam === "normal" || uiScaleParam === "compact")) {
      applyScale(uiScaleParam as UiScaleMode);
      return;
    }

    // 2. 인증 페이지는 무조건 normal 모드 (zoom: 1)
    if (isAuthPage) {
      applyScale("normal");
      return;
    }
    
    // 3. 초기 화면 폭 측정 전에는 서버 초기값을 유지하여 깜빡임 완화
    if (isSmallScreen === null) {
      applyScale(initialZoom === "compact" ? "compact" : "normal");
      return;
    }

    // 4. 화면 너비가 1280px 미만이면 normal 모드 강제 (모바일/중간 디바이스)
    if (isSmallScreen) {
      applyScale("normal");
      return;
    }

    // 5. 그 외 페이지(웹/PC, 대형 모니터)는 compact 모드 (zoom: 0.8)
    applyScale("compact");
  }, [isDev, uiScaleParam, isAuthPage, isSmallScreen, initialZoom]);

  // UI는 렌더링하지 않음
  return null;
}
