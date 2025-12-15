"use client";

import BaseModal from "@/components/common/BaseModal";

type ConversationInfo = {
  id: number;
  name: string;
  platform: "instagram" | "telegram" | "line" | "kakao";
  platformConversationId?: string;
  profileUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conversation: ConversationInfo | null;
  loading?: boolean;
};

export default function UnlinkConversationModal({
  open,
  onClose,
  onConfirm,
  conversation,
  loading = false,
}: Props) {
  if (!open || !conversation) return null;

  const platformLabel =
    conversation.platform === "instagram"
      ? "인스타그램"
      : conversation.platform === "telegram"
      ? "텔레그램"
      : conversation.platform === "line"
      ? "라인"
      : "카카오톡";

  const platformIcon =
    conversation.platform === "instagram"
      ? "/icons/platform/instagram.png"
      : conversation.platform === "telegram"
      ? "/icons/platform/telegram.png"
      : conversation.platform === "line"
      ? "/icons/platform/line.png"
      : "/icons/platform/kakao.png";

  return (
    <BaseModal
      onClose={loading ? () => {} : onClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="relative w-[92vw] min-w-[440px] max-w-[560px] rounded-[14px] bg-white dark:bg-neutral-10 flex flex-col"
      ariaLabel="연동 끊기"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-6 pb-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">연동 끊기</h2>
        <button
          aria-label="close"
          className="cursor-pointer w-6 h-6 grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onClose}
          disabled={loading}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-7 pb-[30px]">
        {/* Warning Icon */}
        <div className="flex justify-center mt-[14px] mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.0001 15V18.3333M20.0001 25H20.0167M8.45305 31.6667H31.5471C34.1131 31.6667 35.7168 28.8889 34.4338 26.6667L22.8868 6.66667C21.6038 4.44444 18.3963 4.44444 17.1133 6.66667L5.5663 26.6667C4.2833 28.8889 5.88705 31.6667 8.45305 31.6667Z"
              stroke="#D83232"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Warning Message */}
        <p className="text-center text-[18px] font-medium text-danger-40 tracking-[-0.02em] mb-[30px]">
          {conversation.name}님과의 연동을 끊으시겠습니까?
        </p>

        {/* Conversation Info Card */}
        <div className="bg-[#F8F8F8] rounded-[8px] px-6 py-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-30 overflow-hidden flex-shrink-0">
            {conversation.profileUrl ? (
              <img
                src={conversation.profileUrl}
                alt={conversation.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[24px] font-semibold text-foreground bg-neutral-20">
                {(conversation.name || "?").charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-semibold text-foreground truncate">
                {conversation.name}
              </span>
              <span className="w-5 h-5 inline-block flex-shrink-0">
                <img
                  src={platformIcon}
                  alt={platformLabel}
                  className="w-full h-full object-contain"
                />
              </span>
            </div>
            <div className="mt-1 text-[14px] text-neutral-60">
              ID : {conversation.platformConversationId || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-7 py-3 border-t border-neutral-30">
        <button
          className="w-[48px] h-[34px] rounded-[5px] border border-neutral-30 text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onClose}
          disabled={loading}
        >
          취소
        </button>
        <button
          className="w-[72px] h-[34px] rounded-[5px] bg-neutral-90 text-neutral-0 text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "처리 중..." : "연동끊기"}
        </button>
      </div>
    </BaseModal>
  );
}
