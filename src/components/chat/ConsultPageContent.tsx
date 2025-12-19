"use client";

import dynamic from "next/dynamic";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";

// 로딩 상태: 레이아웃을 유지하여 깜빡임 방지
function ConsultFallback() {
  return (
    <main className="h-[calc(100vh-54px)] bg-neutral-10 flex flex-col">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-6 flex-1 flex flex-col min-h-0" />
    </main>
  );
}

// ChatView를 SSR 비활성화하여 클라이언트에서만 로드
// (useSearchParams, document 접근 등 브라우저 전용 API 사용)
const ChatView = dynamic(() => import("./ChatView"), {
  ssr: false,
  loading: () => <ConsultFallback />,
});

export default function ConsultPageContent() {
  const [projectId, ready] = useSelectedProjectId();

  // 프로젝트 ID가 없거나 준비되지 않은 경우 동일한 레이아웃 유지
  if (!ready || !projectId) {
    return <ConsultFallback />;
  }

  return (
    <main className="h-[calc(100vh-54px)] bg-neutral-10 flex flex-col">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-6 flex-1 flex flex-col min-h-0">
        <ChatView projectId={Number(projectId)} />
      </div>
    </main>
  );
}

