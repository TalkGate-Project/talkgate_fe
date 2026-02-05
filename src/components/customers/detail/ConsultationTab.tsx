import React, { useState, useRef, useLayoutEffect } from "react";
import { SelectField } from "./SelectField";
import { formatDetailDate } from "./utils";
import { CustomerDetail } from "@/types/customers";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { showConfirmModal } from "@/lib/confirmModalEvents";

type Props = {
  customerName: string;
  notes: CustomerDetail["notes"];
  categories: { id: number; name: string; color?: string }[];
  onAddNote: (categoryId: number | null, note: string) => void;
  onRemoveNote: (id: number) => void;
};

export default function ConsultationTab({
  customerName,
  notes,
  categories,
  onAddNote,
  onRemoveNote,
}: Props) {
  const [noteCategoryId, setNoteCategoryId] = useState<number | "">("");
  const [noteInput, setNoteInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when notes change
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const catId = typeof noteCategoryId === "number" ? noteCategoryId : null;
    onAddNote(catId, noteInput.trim());
    setNoteInput("");
  };

  return (
    <div className="mt-3 flex flex-col">
      <p className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium mb-2">상담 카테고리</p>

      <div className="flex gap-2 mb-3 flex-shrink-0">
        <SelectField
          value={noteCategoryId as any}
          onChange={(e) => setNoteCategoryId(e.target.value ? Number(e.target.value) : "")}
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
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddNote();
            }
          }}
          placeholder="상담 내용을 입력하세요."
          className="flex-1 h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-body-3 bg-card dark:bg-neutral-10 text-foreground dark:text-neutral-90 placeholder:text-neutral-60 dark:placeholder:text-neutral-60"
        />
        <button
          className="cursor-pointer w-[48px] h-[34px] text-body-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0"
          onClick={handleAddNote}
        >
          추가
        </button>
      </div>

      <div
        ref={scrollRef}
        className="space-y-3 border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] p-4 md:p-5 bg-card dark:bg-neutral-10 min-h-0"
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
  );
}

