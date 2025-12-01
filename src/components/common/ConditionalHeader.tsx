"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "../layout/Header";
import LiteHeader from "../layout/LiteHeader";
import { getSelectedProjectId } from "@/lib/project";

export default function ConditionalHeader() {
  const pathname = usePathname();
  // hydration mismatch 방지: 클라이언트에서만 프로젝트 ID 확인
  const [hasProject, setHasProject] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setHasProject(Boolean(getSelectedProjectId()));
    
    // 프로젝트 변경 이벤트 리스닝
    const handleProjectChange = (e: CustomEvent<{ projectId: string | null }>) => {
      setHasProject(Boolean(e.detail.projectId));
    };
    
    window.addEventListener("tg:selected-project-change", handleProjectChange as EventListener);
    return () => {
      window.removeEventListener("tg:selected-project-change", handleProjectChange as EventListener);
    };
  }, []);
  
  if (!pathname) return null;

  const isProjectsRoot = pathname === "/projects";
  const isMySettings = pathname.startsWith("/my-settings");

  // 풀 헤더를 노출하는 업무 경로 (프로젝트 선택 상태와 무관한 경로들)
  const isAlwaysFullHeaderRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consult") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/projects/") || // 프로젝트 스코프 경로 (리다이렉트 용도)
    pathname.startsWith("/notice") || // 공지사항 목록 및 상세 페이지
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications");

  // 마운트 전에는 SSR과 CSR이 같은 결과를 반환하도록 함
  // 프로젝트 의존적인 경로는 마운트 후에만 정확히 판단
  const isFullHeaderRoute = isAlwaysFullHeaderRoute || (mounted && isMySettings && hasProject);

  // 라이트 헤더 노출 조건: 프로젝트 선택 페이지 또는 프로젝트 없는 상태의 개인설정
  // 마운트 전에는 isMySettings만으로 라이트 헤더 표시
  const isLiteHeaderRoute = isProjectsRoot || (isMySettings && (!mounted || !hasProject));

  // 공개 페이지에서는 헤더 숨김
  if (!isFullHeaderRoute && !isLiteHeaderRoute) return null;

  return (
    <>
      {isLiteHeaderRoute ? <LiteHeader /> : <Header />}
      <div style={{ height: 54 }} />
    </>
  );
}


