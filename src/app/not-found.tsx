"use client";

import { useEffect } from "react";
import loginBgImg from "@/assets/images/auth/login_bg.webp";
import Link from "next/link";

const AUTH_BODY_BG = "#494949";
const COMPACT_ZOOM = 0.8;

export default function NotFound() {
  // 404 페이지에서는 zoom을 1로 강제 설정 (컴팩트 모드 예외)
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
      {/* 전체 화면 배경 레이어 (단색 fallback) */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: AUTH_BODY_BG,
        }}
        aria-hidden="true"
      />
      
      {/* 배경 이미지 레이어 (zoom이 항상 1이므로 cover로 충분) */}
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
      
      <main
        className="min-h-screen relative text-white"
      >
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-[120px] leading-[1] font-bold tracking-tight">404</div>
            <div className="mt-3 text-[40px] leading-[49px] font-bold tracking-tight">NOT FOUND</div>
            <div className="mt-6 text-[24px] leading-[29px] font-medium">찾으시는 페이지를 발견할 수 없습니다.</div>
            <Link
              href="/"
              className="mt-10 inline-flex items-center justify-center h-[34px] px-4 rounded-[5px] border border-white/70 text-[14px] font-semibold hover:bg-white/10"
            >
              처음으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}


