"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectType } from "@/hooks/useProjectType";

export default function DebtReliefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { projectType, isDebtRelief, ready } = useProjectType();

  // 다른 메뉴 가드(예: AttendancePageContent)와 동일하게 모달 없이 조용히 리다이렉트.
  // projectType이 null이면 조회 실패 등 타입을 모르는 상태 — 여기서 리다이렉트하면
  // 정상 프로젝트도 일시적 오류로 튕겨나갈 수 있으므로, 판단은 미들웨어(운영 환경의
  // 실제 방어선)에 맡기고 클라이언트에서는 타입을 확실히 아는 경우에만 막는다.
  useEffect(() => {
    if (!ready || projectType === null || isDebtRelief) return;
    router.replace("/dashboard");
  }, [ready, projectType, isDebtRelief, router]);

  return <>{children}</>;
}
