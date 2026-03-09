"use client";

import ChatRightSidebar from "./ChatRightSidebar";

type Props = {
  projectId: number;
  conversationId: number | null;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * 플로팅 AI 상담 도우미 사이드바 컴포넌트
 * 1280px 미만 화면에서 사용됩니다.
 * - 780px 미만: 모바일 시트 형태
 * - 780px 이상: 플로팅 패널 형태
 */
export default function ChatFloatingAiSidebar({ projectId, conversationId, isOpen, onClose }: Props) {
  return (
    <>
      {/* 플로팅 AI 상담 도우미 패널 */}
      {isOpen && (
        <div className="fixed inset-0 z-[90]">
          <div
            className="absolute inset-0"
            onClick={onClose}
            aria-hidden
          />
          <div className="absolute bottom-0 right-0 w-full md:w-[320px] md:max-w-[90vw] h-[calc(100vh-54px)] md:h-auto md:min-h-[520px] md:max-h-[80vh] min-[780px]:top-4 min-[780px]:bottom-44 min-[780px]:h-auto flex flex-col">
            <div className="h-full rounded-t-[14px] md:rounded-[14px] shadow-lg flex flex-col min-h-0 overflow-hidden">
              <ChatRightSidebar
                projectId={projectId}
                conversationId={conversationId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
