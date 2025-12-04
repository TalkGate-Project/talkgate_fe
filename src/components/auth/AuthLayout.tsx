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
  const styleId = useId();
  
  // html/body 배경색 설정 (확대/축소/컴팩트 모드 대응)
  useEffect(() => {
    const styleTagId = `auth-layout-style-${styleId.replace(/:/g, "-")}`;
    
    const existingStyle = document.getElementById(styleTagId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
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
      const styleToRemove = document.getElementById(styleTagId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [styleId]);

  return (
    <>
      {/* 전체 화면 배경 레이어 */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: AUTH_BODY_BG,
          width: "125vw",
          height: "125vh",
        }}
        aria-hidden="true"
      />
      
      {/* 메인 컨테이너 */}
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('${loginBgImg.src}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
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
          <div className="hidden lg:flex flex-col items-start flex-shrink-0">
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
            className="flex-shrink-0"
            style={{
              width: "min(92vw, 564px)",
              height: "100vh",
              backgroundImage: `url('${loginCardImg.src}')`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center top",
              backgroundSize: "100% auto",
            }}
          >
          {/* 카드 내부 콘텐츠 */}
          <div
            className="mx-auto flex flex-col items-center"
            aria-label={ariaLabel}
            style={{
              width: "384px",
              maxWidth: "calc(100% - 40px)",
              paddingTop: "var(--card-padding-top, 130px)",
            }}
          >
            {/* 워드마크 로고 */}
            {showLogo && (
              <div style={{ marginBottom: "50px" }}>
                <TalkGateLogoWordmark />
              </div>
            )}
            
            {/* 페이지별 콘텐츠 */}
            {children}
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
