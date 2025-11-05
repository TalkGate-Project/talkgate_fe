"use client";

import { usePathname } from "next/navigation";
import Header from "../layout/Header";
import LiteHeader from "../layout/LiteHeader";
import { getSelectedProjectId } from "@/lib/project";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (!pathname) return null;

  const hasProject = Boolean(getSelectedProjectId());
  const isProjectsRoot = pathname === "/projects";
  const isMySettings = pathname.startsWith("/my-settings");

  // 풀 헤더를 노출하는 업무 경로
  const isFullHeaderRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consult") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/projects/") || // 프로젝트 스코프 경로 (리다이렉트 용도)
    pathname.startsWith("/notices") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications") ||
    (isMySettings && hasProject); // 프로젝트가 선택된 상태의 개인설정은 풀 헤더

  // 라이트 헤더 노출 조건
  const isLiteHeaderRoute = isProjectsRoot || (isMySettings && !hasProject);

  // 공개 페이지에서는 헤더 숨김
  if (!isFullHeaderRoute && !isLiteHeaderRoute) return null;

  return (
    <>
      {isLiteHeaderRoute ? <LiteHeader /> : <Header />}
      <div style={{ height: 54 }} />
    </>
  );
}


