import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDetailDate } from "./utils";
import { CustomerCategoryHistoryItem, CustomerDetail } from "@/types/customers";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { useMyMember } from "@/hooks/useMyMember";
import UnlinkConversationModal from "@/components/common/UnlinkConversationModal";
import CategoryHistoryModal from "./CategoryHistoryModal";
import CategoryDropdownPortal from "./CategoryDropdownPortal";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";

type Props = {
  customerName: string;
  conversation: CustomerDetail["conversation"];
  currentCategoryId: number | null;
  categoryHistory: CustomerCategoryHistoryItem[];
  categoryHistoryLoading?: boolean;
  notes: CustomerDetail["notes"];
  categories: { id: number; name: string; colorCode?: string }[];
  onChangeCategory: (categoryId: number | null) => Promise<void>;
  onOpenCategoryHistory?: () => Promise<void> | void;
  onAddNote: (note: string) => Promise<void>;
  onRemoveNote: (id: number) => void;
  customerId: number;
  onUnlinkConversation?: () => void;
  maxHeight?: number | null;
};

export default function ConsultationPanel({
  customerName,
  conversation,
  currentCategoryId,
  categoryHistory,
  categoryHistoryLoading = false,
  notes,
  categories,
  onChangeCategory,
  onOpenCategoryHistory,
  onAddNote,
  onRemoveNote,
  customerId,
  onUnlinkConversation,
  maxHeight,
}: Props) {
  const router = useRouter();
  const { isAdminOrSubAdmin } = useMyMember();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [noteInput, setNoteInput] = useState("");
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    setSelectedCategoryId(currentCategoryId ?? "");
  }, [currentCategoryId]);

  useEffect(() => {
    if (!isCategoryDropdownOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !categoryDropdownRef.current?.contains(target) &&
        !categoryButtonRef.current?.contains(target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isCategoryDropdownOpen]);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleAddNote = async () => {
    if (!noteInput.trim() || isAddingNote) return;

    setIsAddingNote(true);
    try {
      await onAddNote(noteInput.trim());
      setNoteInput("");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSelectCategory = async (categoryId: number | null) => {
    setSelectedCategoryId(categoryId ?? "");
    if (categoryId === currentCategoryId || isChangingCategory) {
      setIsCategoryDropdownOpen(false);
      return;
    }

    setIsChangingCategory(true);
    try {
      await onChangeCategory(categoryId);
      setIsCategoryDropdownOpen(false);
    } finally {
      setIsChangingCategory(false);
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

  const handleNavigateToCategorySettings = () => {
    setIsCategoryDropdownOpen(false);
    router.push("/settings?tab=general");
  };

  const handleOpenUnlinkModal = (event: React.MouseEvent) => {
    event.stopPropagation();
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

  const panelStyle = maxHeight ? { maxHeight: `${maxHeight}px` } : undefined;
  const currentCategory = useMemo(
    () =>
      typeof selectedCategoryId === "number"
        ? categories.find((category) => category.id === selectedCategoryId) ?? null
        : null,
    [categories, selectedCategoryId]
  );
  const currentCategoryName = currentCategory?.name ?? NO_CATEGORY_LABEL;
  const currentCategoryStyle = getBadgeStyle(
    currentCategoryName,
    currentCategory?.id ?? 0,
    currentCategory?.colorCode
  );
  const categoryOptions = useMemo(
    () => [
      { id: null as number | null, name: NO_CATEGORY_LABEL, colorCode: undefined },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        colorCode: category.colorCode,
      })),
    ],
    [categories]
  );
  const handleOpenHistoryModal = () => {
    setIsHistoryModalOpen(true);
    void onOpenCategoryHistory?.();
  };

  return (
    <div
      className="col-span-12 md:col-span-1 md:w-[330px] md:min-w-[330px] md:max-w-[330px] lg:w-[384px] lg:min-w-[384px] lg:max-w-[384px] flex flex-col overflow-hidden"
      style={panelStyle}
    >
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
                      src="/icons/platform/instagram.webp"
                      alt="Instagram"
                      className="w-full h-full object-contain"
                    />
                  </span>
                )}
                {conversation!.platform === "telegram" && (
                  <span className="w-4 h-4 inline-block">
                    <img
                      src="/icons/platform/telegram.webp"
                      alt="Telegram"
                      className="w-full h-full object-contain"
                    />
                  </span>
                )}
                {conversation!.platform === "line" && (
                  <span className="w-4 h-4 inline-block">
                    <img
                      src="/icons/platform/line.webp"
                      alt="Line"
                      className="w-full h-full object-contain"
                    />
                  </span>
                )}
                <span className="truncate">{platformLabel}</span>
              </div>
            </div>
          </div>
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

      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
        <section className="rounded-[5px] bg-card dark:bg-neutral-10 flex-shrink-0">
          <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90">
            카테고리
          </div>
          <div className="mt-3 h-[58px] w-full rounded-[5px] border border-[#E2E2E2] dark:border-neutral-30 px-4 flex items-center justify-between gap-3">
            <button
              ref={categoryButtonRef}
              type="button"
              className="inline-flex max-w-full items-center gap-2 rounded-[30px] px-3 py-2 text-[12px] font-medium disabled:opacity-60"
              style={currentCategoryStyle}
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              disabled={isChangingCategory}
            >
              <span className="truncate">{currentCategoryName}</span>
              <svg
                width="10"
                height="8"
                viewBox="0 0 10 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${isCategoryDropdownOpen ? "rotate-180" : ""} transition-transform`}
              >
                <path
                  d="M5.5068 7.25009C5.22417 7.61647 4.67583 7.61647 4.3932 7.25009L0.430435 2.13452C0.00873756 1.58913 0.396109 0.800097 1.03724 0.800097L8.86276 0.800098C9.50389 0.800098 9.89126 1.58913 9.46957 2.13452L5.5068 7.25009Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <button
              type="button"
              className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center text-neutral-50 transition-colors hover:text-neutral-70"
              onClick={handleOpenHistoryModal}
              aria-label="카테고리 기록 보기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </section>

        <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90 flex-shrink-0">
            상담 내용 기록
          </div>

          <div className="mt-3 flex-1 min-h-0 flex flex-col overflow-hidden border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] bg-card dark:bg-neutral-10 p-5">
            <div className="flex gap-2 mb-3 flex-shrink-0">
              <input
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.repeat && !isAddingNote) {
                    event.preventDefault();
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

            <div ref={scrollRef} className="flex-1 min-h-0 space-y-3 overflow-auto">
              {notes?.length ? (
                notes.map((noteItem) => (
                  <div
                    key={noteItem.id}
                    className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] px-4 py-3 relative"
                  >
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="min-w-0 truncate text-neutral-80 dark:text-neutral-70">
                        {noteItem.memberName || ""}
                      </span>
                      <div className="text-neutral-60 dark:text-neutral-60 flex gap-x-3 items-center justify-end">
                        <span className="text-right">
                          {formatDetailDate(noteItem.createdAt)}
                        </span>
                        <button
                          className="cursor-pointer w-5 h-5 grid place-items-center rounded-full bg-black dark:bg-neutral-80 text-white dark:text-neutral-0"
                          onClick={() => {
                            showConfirmModal({
                              title: "확인",
                              message: "상담 내용을 삭제하시겠습니까?",
                              confirmText: "삭제",
                              cancelText: "취소",
                              onConfirm: () => onRemoveNote(noteItem.id),
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
                    <div className="mt-2 text-[14px] text-neutral-70 dark:text-neutral-70">
                      {noteItem.note}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] bg-neutral-10 dark:bg-neutral-25 px-4 py-4 text-[14px] text-neutral-60">
                  아직 기록된 상담 메모가 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

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
      <CategoryDropdownPortal
        open={isCategoryDropdownOpen}
        anchorRef={categoryButtonRef}
        dropdownRef={categoryDropdownRef}
        options={categoryOptions}
        selectedCategoryId={selectedCategoryId === "" ? null : selectedCategoryId}
        onSelect={(categoryId) => void handleSelectCategory(categoryId)}
        disabled={isChangingCategory}
        showManageButton={isAdminOrSubAdmin}
        onManageButtonClick={handleNavigateToCategorySettings}
      />
      <CategoryHistoryModal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        customerName={customerName}
        history={categoryHistory}
        loading={categoryHistoryLoading}
      />
    </div>
  );
}
