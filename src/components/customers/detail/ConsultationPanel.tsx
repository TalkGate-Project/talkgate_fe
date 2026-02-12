import React, { useState, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { SelectField } from "./SelectField";
import { formatDetailDate } from "./utils";
import { CustomerDetail } from "@/types/customers";
import { getBadgeStyle } from "@/utils/categoryBadge";
import UnlinkConversationModal from "@/components/common/UnlinkConversationModal";
import { showConfirmModal } from "@/lib/confirmModalEvents";

type Props = {
  customerName: string;
  conversation: CustomerDetail["conversation"];
  notes: CustomerDetail["notes"];
  categories: { id: number; name: string; color?: string }[];
  onAddNote: (categoryId: number | null, note: string) => Promise<void>;
  onRemoveNote: (id: number) => void;
  customerId: number;
  onUnlinkConversation?: () => void;
  /** 왼쪽 패널 높이에 맞춰 오른쪽 패널 높이 제한 */
  maxHeight?: number | null;
};

export default function ConsultationPanel({
  customerName,
  conversation,
  notes,
  categories,
  onAddNote,
  onRemoveNote,
  customerId,
  onUnlinkConversation,
  maxHeight,
}: Props) {
  const router = useRouter();
  const [noteCategoryId, setNoteCategoryId] = useState<number | "">("");
  const [noteInput, setNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Scroll to bottom when notes change
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleAddNote = async () => {
    if (!noteInput.trim() || isAddingNote) return;
    const catId = typeof noteCategoryId === "number" ? noteCategoryId : null;
    setIsAddingNote(true);
    try {
      await onAddNote(catId, noteInput.trim());
      setNoteInput("");
    } finally {
      setIsAddingNote(false);
    }
  };

  const hasConversation = Boolean(conversation);
  const platformLabel = hasConversation
    ? conversation!.platform === "instagram"
      ? "인스타그램"
      : conversation!.platform === "telegram"
      ? "텔레그램"
      : conversation!.platform === "line"
      ? "라인"
      : "카카오톡"
    : "연결된 채팅방이 없습니다";

  const handleNavigateToChat = () => {
    if (!conversation) return;
    const params = new URLSearchParams();
    params.set("conversationId", String(conversation.id));
    params.set("platform", conversation.platform);
    params.set("customerId", String(customerId));
    router.push(`/consult?${params.toString()}`);
  };

  const handleOpenUnlinkModal = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
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

  // 오른쪽 패널 스타일: 왼쪽 높이를 기준으로 제한
  const panelStyle = maxHeight ? { maxHeight: `${maxHeight}px` } : undefined;

  return (
    <div
      className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col overflow-hidden"
      style={panelStyle}
    >
      {/* Conversation Card - 연결된 채팅방이 있을 때만 표시 */}
      {hasConversation && (
        <div 
          className="mb-[30px] border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] bg-[#F8F8F8] dark:bg-neutral-10 px-6 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F0F0F0] dark:hover:bg-neutral-20 transition-colors flex-shrink-0"
          onClick={handleNavigateToChat}
        >
          <div className="flex items-center gap-4 min-w-0">
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
            <div className="min-w-0">
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
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[5px] border bg-primary-10 dark:bg-primary-10/30 border-primary-80 dark:border-primary-60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}

      {/* Consultation Notes */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90 mb-3 flex-shrink-0">
          상담 내용 기록
        </div>
        <div className="border-b border-[#E2E2E2] dark:border-neutral-30 mb-2 flex-shrink-0" />
        <p className="text-[14px] text-[#6B7280] font-medium mb-2 flex-shrink-0">상담 카테고리</p>
        
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <SelectField
            value={noteCategoryId as any}
            onChange={(e) =>
              setNoteCategoryId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-[106px] h-[34px] rounded-[5px] text-body-3"
          >
            <option value="">일반</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.repeat && !isAddingNote) {
                e.preventDefault();
                void handleAddNote();
              }
            }}
            placeholder="상담 내용을 입력하세요."
            className="flex-1 h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-body-3 bg-card dark:bg-neutral-10 text-foreground dark:text-neutral-90 placeholder:text-neutral-60 dark:placeholder:text-neutral-60"
          />
          <button
            className="cursor-pointer w-[48px] min-w-[48px] shrink-0 h-[34px] text-body-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => void handleAddNote()}
            disabled={isAddingNote || !noteInput.trim()}
          >
            추가
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 space-y-3 overflow-auto border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] p-5 bg-card dark:bg-neutral-10"
        >
          {notes?.map((n) => {
            const category = n.categoryId !== null ? categories.find((c) => c.id === n.categoryId) : null;
            const categoryName = n.categoryId === null ? "일반" : (category?.name || "알 수 없음");
            const badgeStyle = getBadgeStyle(categoryName, n.categoryId ?? 0);

            return (
              <div
                key={n.id}
                className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] px-4 py-3 relative"
              >
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-x-2">
                    <div
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-[30px] text-[12px] leading-[14px] font-medium ${badgeStyle.bg} ${badgeStyle.text}`}
                    >
                      {categoryName}
                    </div>
                    {/* 노트를 작성한 담당자 이름이 우선, 없으면 빈 문자열 */}
                    <span className="text-[12px] text-neutral-80 dark:text-neutral-70">
                      {n.memberName || ""}
                    </span>
                  </div>
                  <div className="text-neutral-60 dark:text-neutral-60 flex gap-x-3 items-center justify-end">
                    <span className="text-right">
                      {formatDetailDate(n.createdAt)}
                    </span>
                    <button
                      className="cursor-pointer w-5 h-5 grid place-items-center rounded-full bg-black dark:bg-neutral-80 text-white dark:text-neutral-0"
                      onClick={() => {
                        // Validation: id가 유효한 정수인지 확인
                        if (
                          typeof n.id !== "number" ||
                          !Number.isInteger(n.id) ||
                          n.id <= 0 ||
                          !Number.isFinite(n.id)
                        ) {
                          console.error("Invalid note id:", n.id);
                          return;
                        }
                        showConfirmModal({
                          title: "확인",
                          message: "상담 내용을 삭제하시겠습니까?",
                          confirmText: "삭제",
                          cancelText: "취소",
                          onConfirm: () => onRemoveNote(n.id),
                        });
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 9L9 3M3 3L9 9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[14px] text-neutral-70 dark:text-neutral-70">{n.note}</div>
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
