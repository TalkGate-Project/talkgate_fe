"use client";

import { usePathname } from "next/navigation";
import Header from "../layout/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (!pathname) return null;
  // 헤더는 보호 영역과 실제 업무 화면에서만 노출합니다.
  // 공개 페이지(로그인/회원가입/비번찾기/초대) 및 존재하지 않는 경로(404)에서는 숨깁니다.
  const shouldShow =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consult") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/notice") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/settings");
  if (!shouldShow) return null;
  return (
    <>
      <Header />
      <div style={{ height: 54 }} />
    </>
  );
}


