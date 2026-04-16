import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatDetailDate } from "./utils";
import { CustomerCategoryHistoryItem, CustomerDetail } from "@/types/customers";
import { getBadgeStyle } from "@/utils/categoryBadge";
import CategoryHistoryModal from "./CategoryHistoryModal";
import CategoryDropdownPortal from "./CategoryDropdownPortal";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";

type Props = {
  customerName: string;
  notes: CustomerDetail["notes"];
  categories: { id: number; name: string; colorCode?: string }[];
  currentCategoryId: number | null;
  categoryHistory: CustomerCategoryHistoryItem[];
  categoryHistoryLoading?: boolean;
  onChangeCategory: (categoryId: number | null) => Promise<void>;
  onOpenCategoryHistory?: () => Promise<void> | void;
  onAddNote: (note: string) => Promise<void>;
  onRemoveNote: (id: number) => void;
};

export default function ConsultationTab({
  customerName,
  notes,
  categories,
  currentCategoryId,
  categoryHistory,
  categoryHistoryLoading = false,
  onChangeCategory,
  onOpenCategoryHistory,
  onAddNote,
  onRemoveNote,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [noteInput, setNoteInput] = useState("");
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

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
    <div className="mt-3 flex flex-col gap-4">
      <section className="rounded-[12px] bg-card dark:bg-neutral-10 p-4">
        <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90">
          카테고리
        </div>
        <div className="mt-3 flex items-center gap-6">
          <div>
            <button
              ref={categoryButtonRef}
              type="button"
              className="inline-flex max-w-full items-center gap-2 rounded-[30px] px-4 py-2 text-[14px] font-semibold disabled:opacity-60"
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
          </div>

          <button
            type="button"
            className="grid h-6 w-6 shrink-0 place-items-center text-neutral-50 transition-colors hover:text-neutral-70"
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

      <section className="rounded-[12px] border border-[#E2E2E2] dark:border-neutral-30 bg-card dark:bg-neutral-10 p-4">
        <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90 mb-3">
          상담 메모
        </div>

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
            className="flex-1 h-[38px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-body-3 bg-card dark:bg-neutral-10 text-foreground dark:text-neutral-90 placeholder:text-neutral-60 dark:placeholder:text-neutral-60"
          />
          <button
            className="cursor-pointer w-[56px] min-w-[56px] shrink-0 h-[38px] text-body-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => void handleAddNote()}
            disabled={isAddingNote || !noteInput.trim()}
          >
            추가
          </button>
        </div>

        <div ref={scrollRef} className="space-y-3 min-h-0">
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
                        if (
                          typeof noteItem.id !== "number" ||
                          !Number.isInteger(noteItem.id) ||
                          noteItem.id <= 0 ||
                          !Number.isFinite(noteItem.id)
                        ) {
                          console.error("Invalid note id:", noteItem.id);
                          return;
                        }
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
      </section>
      <CategoryDropdownPortal
        open={isCategoryDropdownOpen}
        anchorRef={categoryButtonRef}
        dropdownRef={categoryDropdownRef}
        options={categoryOptions}
        selectedCategoryId={selectedCategoryId === "" ? null : selectedCategoryId}
        onSelect={(categoryId) => void handleSelectCategory(categoryId)}
        disabled={isChangingCategory}
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

