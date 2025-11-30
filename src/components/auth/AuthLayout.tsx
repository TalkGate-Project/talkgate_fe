"use client";

import { useEffect, ReactNode, useId } from "react";
import TalkGateLogoLarge from "@/components/common/icons/TalkGateLogoLarge";
import TalkGateLogoWordmark from "@/components/common/icons/TalkGateLogoWordmark";
import loginBgImg from "@/assets/images/auth/login_bg.png";
import loginCardImg from "@/assets/images/auth/login_card.png";

/**
 * Auth 페이지 공통 배경색 (확대/축소/컴팩트 모드 대응)
 * 배경 이미지의 주요 톤과 어울리는 단색
 */
const AUTH_BODY_BG = "#494949";

interface AuthLayoutProps {
  /** 카드 내부에 렌더링될 콘텐츠 */
  children: ReactNode;
  /** 워드마크 로고 표시 여부 (기본값: true) */
  showLogo?: boolean;
  /** 카드 내부 콘텐츠 영역의 상단 패딩 비율 (기본값: 0.556) */
  cardPaddingTopRatio?: number;
  /** 카드 내부 콘텐츠 영역의 너비 비율 (기본값: 0.572) */
  cardContentWidthRatio?: number;
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
  cardPaddingTopRatio = 0.556,
  cardContentWidthRatio = 0.572,
  ariaLabel = "auth-form-area",
}: AuthLayoutProps) {
  const styleId = useId();
  
  // html/body 배경색 설정 (확대/축소/컴팩트 모드 대응)
  // style 태그를 head에 추가하여 CSS 우선순위 문제를 확실하게 해결
  useEffect(() => {
    const styleTagId = `auth-layout-style-${styleId.replace(/:/g, "-")}`;
    
    // 기존 style 태그가 있으면 제거
    const existingStyle = document.getElementById(styleTagId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // style 태그 생성 및 head에 추가
    // 다양한 선택자로 모든 경우를 커버
    const styleTag = document.createElement("style");
    styleTag.id = styleTagId;
    styleTag.textContent = `
      html,
      html[data-theme],
      html[data-theme="light"],
      html[data-theme="dark"],
      body {
        background-color: ${AUTH_BODY_BG} !important;
        --background: ${AUTH_BODY_BG} !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      // 컴포넌트 언마운트 시 style 태그 제거
      const styleToRemove = document.getElementById(styleTagId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [styleId]);

  return (
    <>
      {/* 전체 화면 배경 레이어 - zoom/scale 변환으로 인한 빈 영역 커버 */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: AUTH_BODY_BG,
          // zoom 적용 시에도 전체 뷰포트를 덮도록 125% 크기 사용
          width: "125vw",
          height: "125vh",
          top: 0,
          left: 0,
        }}
        aria-hidden="true"
      />
      <main
        className="min-h-screen relative"
        style={{
          backgroundImage: `url('${loginBgImg.src}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
      {/* 좌측 브랜드 영역: 로고 + 슬로건 */}
      <div className="absolute left-0 top-0 h-screen w-[58vw] hidden lg:flex items-center pointer-events-none select-none">
        <div className="pl-[10vw] text-white flex flex-col items-center">
          <TalkGateLogoLarge />
          <div className="mt-4 text-white text-[32px] leading-[38px] font-medium">
            "Your Gateway to Smarter Sales"
          </div>
        </div>
      </div>

      {/* 우측 카드 영역 */}
      <div
        className="
          absolute top-0 h-screen flex justify-center
          md:left-1/2 md:-translate-x-1/2
          lg:left-auto lg:translate-x-0 lg:right-[8vw]
          xl:right-[12vw]
        "
        style={{
          // 반응형 카드 너비: 1440/1920에서 594px 유지, 초광폭에서 확대, 작은 화면에서 92vw로 제한
          width: "min(92vw, clamp(594px, 30vw, 1080px))",
          backgroundImage: `url('${loginCardImg.src}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "100% auto",
        }}
      >
        {/* 카드 내부 콘텐츠 영역 */}
        <div
          className="mx-auto flex flex-col items-center"
          aria-label={ariaLabel}
          style={{
            // 카드 너비에 비례하는 내부 콘텐츠 너비
            width: `min(90%, calc(min(92vw, clamp(594px, 30vw, 1080px)) * ${cardContentWidthRatio}))`,
            // 카드 아트워크에 맞춘 상단 패딩
            paddingTop: `calc(min(92vw, clamp(594px, 30vw, 1080px)) * ${cardPaddingTopRatio})`,
          }}
        >
          {/* 워드마크 로고 */}
          {showLogo && <TalkGateLogoWordmark />}
          
          {/* 페이지별 콘텐츠 */}
          {children}
        </div>
      </div>
    </main>
    </>
  );
}
