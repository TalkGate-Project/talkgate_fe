import React, { useState } from "react";
import { useRouter } from "next/navigation";
import UnlinkConversationModal from "@/components/common/UnlinkConversationModal";
import { CustomerDetail } from "@/types/customers";

type Props = {
  customerId: number;
  customerName: string;
  conversation: CustomerDetail["conversation"];
  onUnlinkConversation?: () => void;
};

export default function ConversationCard({
  customerId,
  customerName,
  conversation,
  onUnlinkConversation,
}: Props) {
  const router = useRouter();
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const hasConversation = Boolean(conversation);
  if (!hasConversation) return null;

  const platformLabel =
    conversation!.platform === "instagram"
      ? "인스타그램"
      : conversation!.platform === "telegram"
      ? "텔레그램"
      : conversation!.platform === "line"
      ? "라인"
      : "카카오톡";

  const handleNavigateToChat = () => {
    if (!conversation) return;
    const params = new URLSearchParams();
    params.set("conversationId", String(conversation.id));
    params.set("platform", conversation.platform);
    params.set("customerId", String(customerId));
    router.push(`/consult?${params.toString()}`);
  };

  const handleOpenUnlinkModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUnlinkConversation || unlinking) return;
    setUnlinkModalOpen(true);
  };

  const handleConfirmUnlink = async () => {
    if (!onUnlinkConversation || unlinking) return;

    setUnlinking(true);
    try {
      await onUnlinkConversation();
      setUnlinkModalOpen(false);
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <>
      <div
        className="border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] bg-[#F8F8F8] dark:bg-neutral-10 px-4 py-3 md:px-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F0F0F0] dark:hover:bg-neutral-20 transition-colors"
        onClick={handleNavigateToChat}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-full bg-neutral-30 dark:bg-neutral-30 overflow-hidden flex-shrink-0">
            {conversation!.profileUrl ? (
              <img
                src={conversation!.profileUrl as string}
                alt={conversation!.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[18px] font-semibold text-foreground dark:text-neutral-90">
                {(conversation?.name || customerName || "홍").charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-foreground dark:text-neutral-90 truncate">
              {conversation!.name || `${customerName}님과의 채팅`}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[14px] text-neutral-60 dark:text-neutral-60">
              {conversation!.platform === "instagram" && (
                <span className="w-4 h-4 inline-block">
                  <img
                    src="/icons/platform/instagram.png"
                    alt="Instagram"
                    className="w-full h-full object-contain"
                  />
                </span>
              )}
              {conversation!.platform === "telegram" && (
                <span className="w-4 h-4 inline-block">
                  <img
                    src="/icons/platform/telegram.png"
                    alt="Telegram"
                    className="w-full h-full object-contain"
                  />
                </span>
              )}
              {conversation!.platform === "line" && (
                <span className="w-4 h-4 inline-block">
                  <img
                    src="/icons/platform/line.png"
                    alt="Line"
                    className="w-full h-full object-contain"
                  />
                </span>
              )}
              <span className="truncate">{platformLabel}</span>
            </div>
          </div>
        </div>
        {/* 연동 끊기 버튼 */}
        {onUnlinkConversation && (
          <button
            type="button"
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[5px] border bg-primary-10 dark:bg-primary-10/30 border-primary-80 dark:border-primary-60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            onClick={handleOpenUnlinkModal}
            disabled={unlinking}
            aria-label="연동 끊기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.5237 8.47631C10.2219 7.17456 8.11139 7.17456 6.80964 8.47631L3.47631 11.8096C2.17456 13.1114 2.17456 15.2219 3.47631 16.5237C4.77806 17.8254 6.88861 17.8254 8.19036 16.5237L9.10832 15.6057M8.47631 11.5237C9.77806 12.8254 11.8886 12.8254 13.1904 11.5237L16.5237 8.19036C17.8254 6.88861 17.8254 4.77806 16.5237 3.47631C15.2219 2.17456 13.1114 2.17456 11.8096 3.47631L10.8933 4.39265"
                stroke="currentColor"
                className="text-primary-80 dark:text-primary-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 연동 끊기 확인 모달 */}
      {conversation && (
        <UnlinkConversationModal
          open={unlinkModalOpen}
          onClose={() => setUnlinkModalOpen(false)}
          onConfirm={handleConfirmUnlink}
          conversation={{
            id: conversation.id,
            name: conversation.name || `${customerName}님과의 채팅`,
            platform: conversation.platform as "line" | "telegram" | "instagram" | "kakao",
            platformConversationId: conversation.platformConversationId,
            profileUrl: conversation.profileUrl,
          }}
          loading={unlinking}
        />
      )}
    </>
  );
}

