"use client";

import { useEffect, useState, ReactNode } from "react";
import TalkGateLogoLarge from "@/components/common/icons/TalkGateLogoLarge";
import TalkGateLogoWordmark from "@/components/common/icons/TalkGateLogoWordmark";
import loginBgImg from "@/assets/images/auth/login_bg.png";
import loginCardContents from "@/assets/images/auth/login_card_contents.png";
import loginCardStrap from "@/assets/images/auth/login_card_strap.png";

/**
 * Auth 페이지 공통 배경색 (확대/축소/컴팩트 모드 대응)
 * 배경 이미지의 주요 톤과 어울리는 단색
 */
const AUTH_BODY_BG = "#494949";

const COMPACT_ZOOM = 0.8;

interface AuthLayoutProps {
  /** 카드 내부에 렌더링될 콘텐츠 */
  children: ReactNode;
  /** 워드마크 로고 표시 여부 (기본값: true) */
  showLogo?: boolean;
  /** 접근성 aria-label (기본값: "auth-form-area") */
  ariaLabel?: string;
}

/**
 * 로그인, 회원가입, 비밀번호 찾기, 2FA 인증 등
 * Auth 관련 페이지에서 공통으로 사용하는 레이아웃 컴포넌트
 */
export default function AuthLayout({
  children,
  showLogo = true,
  ariaLabel = "auth-form-area",
}: AuthLayoutProps) {
  // Strap top 값을 캔버스 높이에 따라 동적으로 계산
  const [strapTop, setStrapTop] = useState(-810);

  useEffect(() => {
    const calculateStrapTop = () => {
      const height = window.innerHeight;
      
      // 선형 공식: top = (height - 1890) * 0.4974 - 670
      // 캔버스 높이가 증가할수록 top 값도 증가 (더 양수 방향으로)
      // 최소값: -810px (약 1417.5px 이하에서 고정)
      const calculatedTop = (height - 1890) * 0.4974 - 670;
      setStrapTop(Math.max(calculatedTop, -810));
    };

    calculateStrapTop();
    window.addEventListener("resize", calculateStrapTop);

    return () => {
      window.removeEventListener("resize", calculateStrapTop);
    };
  }, []);

  // Auth 페이지에서는 zoom을 1로 강제 설정 (컴팩트 모드 예외)
  useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;
    // 현재 zoom 값 저장 (복원용)
    const originalZoom = (body.style as any).zoom || String(COMPACT_ZOOM);
    const originalTransform = body.style.transform || "";
    const originalTransformOrigin = body.style.transformOrigin || "";
    const originalMinHeight = body.style.minHeight || "";

    // zoom을 1로 강제 설정
    (body.style as any).zoom = "1";
    body.style.transform = "";
    body.style.transformOrigin = "";
    body.style.minHeight = "";

    // cleanup: 원래 zoom 값으로 복원
    return () => {
      (body.style as any).zoom = originalZoom;
      body.style.transform = originalTransform;
      body.style.transformOrigin = originalTransformOrigin;
      body.style.minHeight = originalMinHeight;
    };
  }, []);

  return (
    <>
      {/* ==================================================================================== */}
      {/* 1. Desktop Layout (lg 이상) - 기존 코드 100% 보존 + lg:block hidden */}
      {/* ==================================================================================== */}
      <div className="hidden lg:block">
        {/* 전체 화면 배경 레이어 (단색 fallback) */}
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: AUTH_BODY_BG,
          }}
          aria-hidden="true"
        />
        
        {/* 배경 이미지 레이어 */}
        <div
          className="fixed inset-0 -z-[9]"
          style={{
            backgroundImage: `url('${loginBgImg.src}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        
        {/* 메인 컨테이너 */}
        <main
          className="min-h-screen flex items-center justify-center relative"
        >
          {/* 중앙 정렬 컨테이너 */}
          <div 
            className="flex items-center justify-center gap-[clamp(40px,8vw,200px)]"
            style={{
              width: "100%",
              maxWidth: "1600px",
              paddingInline: "40px",
            }}
          >
            {/* 좌측 브랜드 영역 */}
            <div className="flex flex-col items-start flex-shrink-0">
              <TalkGateLogoLarge />
              <div 
                className="text-white font-medium"
                style={{
                  marginTop: "30px",
                  fontSize: "32px",
                  lineHeight: "38px",
                }}
              >
                "Your Gateway to Smarter Sales"
              </div>
            </div>

            {/* 우측 카드 영역 */}
            <div
              className="flex-shrink-0 relative flex items-center justify-center overflow-hidden"
              style={{
                width: "564px", // 기존 width style 복구
                height: "100vh",
              }}
            >
              {/* Strap */}
              <div
                className="absolute left-1/2 -translate-x-[41%] z-[0]"
                style={{
                  top: `${strapTop}px`,
                  width: "41%",
                  height: "calc(50vh + var(--card-padding-top, 310px) + 80px)",
                  backgroundImage: `url('${loginCardStrap.src}')`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "top center",
                  backgroundSize: "100% auto",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
                aria-hidden="true"
              />
              
              {/* Form 컨테이너 */}
              <div
                className="relative mx-auto flex flex-col items-center !px-[15px] md:!px-[70px] rounded-b-[24px] overflow-hidden z-[1]"
                aria-label={ariaLabel}
                style={{
                  width: "564px",
                  maxWidth: "calc(100% - 20px)",
                  height: "1000px",
                  backgroundImage: `url('${loginCardContents.src}')`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center 80px",
                  backgroundSize: "110% auto",
                  padding: "var(--card-padding-top, 310px) 0 var(--card-padding-bottom, 100px) 0",
                  zIndex: 2,
                }}
              >
                {/* 워드마크 로고 */}
                {showLogo && (
                  <div style={{ marginBottom: "50px" }}>
                    <TalkGateLogoWordmark />
                  </div>
                )}
                
                {/* 페이지별 콘텐츠 - 스크롤 가능한 영역 */}
                <div className="w-full flex-1 overflow-y-auto min-h-0 px-[10px] md:px-[20px]">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ==================================================================================== */}
      {/* 2. Mobile Layout (lg 미만) - 완전 별도 구현 (3번 시안) */}
      {/* ==================================================================================== */}
      <div className="block lg:hidden min-h-screen relative overflow-hidden">
        {/* 배경 이미지: 전체 화면 채움 */}
        <div
          className="fixed inset-0 -z-[9]"
          style={{
            backgroundImage: `url('${loginCardContents.src}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "top center",
          }}
          aria-hidden="true"
        >
          {/* 어두운 오버레이 & 그라데이션 */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* 모바일 컨텐츠 영역 */}
        <main className="min-h-screen flex flex-col items-center justify-center px-6 w-full relative z-10">
          {/* 워드마크 로고 */}
          {showLogo && (
            <div className="mb-10">
              <TalkGateLogoWordmark />
            </div>
          )}
          
          {/* 
            폼 컨테이너 
            - 모바일에서는 카드가 아니라 투명 배경에 폼만 띄움
            - width 제한(max-w-[384px])을 두어 너무 늘어나지 않게 함
            - 스크롤 가능하도록 max-height와 overflow-y-auto 추가
          */}
          <div className="w-full max-w-[384px] max-h-[calc(100vh-360px)] overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
