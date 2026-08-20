"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BaseModal from "@/components/common/BaseModal";
import Checkbox from "@/components/common/Checkbox";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";
import { getBodyZoom } from "@/utils/zoom";

export type Messenger =
  | "all"
  | "telegram"
  | "instagram"
  | "line"
  | "kakao"
  | "facebook"
  | "x";

export type ChatFilterDefaults = {
  messenger?: Messenger;
  categoryIds?: (number | null)[]; // ex) [1, 2, null] - null은 "일반" 카테고리를 의미
};

export default function ChatFilterModal({
  open,
  defaults,
  onClose,
  onApply,
}: {
  open: boolean;
  defaults?: ChatFilterDefaults;
  onClose: () => void;
  onApply: (next: ChatFilterDefaults) => void;
}) {
  const [messenger, setMessenger] = useState<Messenger>(
    defaults?.messenger ?? "all"
  );
  const [categoryIds, setCategoryIds] = useState<(number | null)[]>(defaults?.categoryIds ?? []);
  const { categories: categoryOptions } = useCustomerNoteCategories();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessenger(defaults?.messenger ?? "all");
    setCategoryIds(defaults?.categoryIds ?? []);
  }, [open, defaults]);

  // Dropdown 위치 계산
  useEffect(() => {
    if (!categoryOpen || !buttonRef.current) {
      setDropdownPosition(null);
      return;
    }

    const zoom = getBodyZoom();
    const buttonRect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: (buttonRect.bottom + 8) / zoom,
      left: buttonRect.left / zoom,
      width: buttonRect.width / zoom,
    });
  }, [categoryOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!categoryOpen) return;
      if (!dropdownRef.current || !buttonRef.current) return;
      const target = e.target as Node;
      if (!dropdownRef.current.contains(target) && !buttonRef.current.contains(target)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [categoryOpen]);

  if (!open) return null;

  const getCategoryStyle = (
    id: number | null,
    name?: string,
    colorCode?: string | null
  ): CSSProperties => getBadgeStyle(name ?? NO_CATEGORY_LABEL, id ?? 0, colorCode);

  const items: { key: Messenger; label: string; icon?: string }[] = [
    { key: "all", label: "전체" },
    { key: "telegram", label: "텔레그램", icon: "/telegram.webp" },
    { key: "instagram", label: "인스타그램", icon: "/instagram.webp" },
    { key: "line", label: "네이버앱", icon: "/naver_line.webp" },
    // { key: "kakao", label: "카카오톡", icon: "/kakao_icon.png" },
    // { key: "facebook", label: "페이스북", icon: "/facebook.png" },
    // { key: "x", label: "트위터(X)", icon: "/x_twitter.webp" },
  ];


  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      ariaLabel="필터설정"
      disableAutoContainerSizing
      containerClassName="relative w-[calc(100%-32px)] md:w-[440px] max-h-[90vh] overflow-y-auto rounded-[14px] bg-neutral-0 dark:bg-neutral-10"
    >
          {/* Header */}
          <div className="px-4 md:px-7 pt-4 md:pt-6 pb-4 md:pb-[30px] flex items-center justify-between">
            <h2 className="text-[18px] leading-[21px] font-semibold text-neutral-90">
              필터설정
            </h2>
            <button
              aria-label="close"
              onClick={onClose}
              className="cursor-pointer w-6 h-6 grid place-items-center"
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

          {/* Body */}
          <div className="px-4 md:px-7 space-y-5 md:space-y-6 mb-4 md:mb-[30px]">
            {/* 메신저 아이콘 */}
            <div>
              <div className="text-[14px] text-medium text-neutral-60 mb-2">메신저</div>
              <div className="grid grid-cols-4 md:flex md:items-center gap-2 md:gap-3">
                {/* 전체 버튼 */}
                <button
                  onClick={() => setMessenger("all")}
                  className={`cursor-pointer w-full md:w-[48px] h-[34px] rounded-[5px] border text-[14px] ${
                    messenger === "all"
                      ? "border-2 border-primary-40 bg-primary-10/30 font-bold"
                      : "border-border bg-card dark:bg-neutral-10"
                  }`}
                >
                  전체
                </button>
                {items
                  .filter((i) => i.key !== "all")
                  .map((it) => (
                    <button
                      key={it.key}
                      onClick={() => setMessenger(it.key)}
                      className={`cursor-pointer w-full md:w-[44px] h-[34px] rounded-[5px] border grid place-items-center ${
                        messenger === it.key
                          ? "border-2 border-primary-40 bg-primary-10/30 dark:!bg-primary-10/10"
                          : "border-border bg-card dark:bg-neutral-10"
                      }`}
                    >
                      {it.key === "x" ? (
                        <>
                          <img src="/x_twitter.webp" alt="" className="w-5 h-5 dark:hidden" />
                          <img src="/x_twitter_dark.webp" alt="" className="w-5 h-5 hidden dark:block" />
                        </>
                      ) : (
                        <img src={it.icon!} alt="" className="w-5 h-5" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* 카테고리 멀티 선택 */}
            <div className="relative">
              <div className="text-[14px] text-medium text-neutral-60 mb-2">카테고리</div>
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setCategoryOpen((v) => !v)}
                className="w-full h-[34px] border border-neutral-30 rounded-[5px] px-3 flex items-center justify-between bg-neutral-0 dark:bg-neutral-10"
              >
                <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-neutral-90 opacity-90">
                  {categoryIds.length
                    ? `${categoryIds.length}개 선택됨`
                    : "카테고리 선택"}
                </span>
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${categoryOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M5.5068 7.25009C5.22417 7.61647 4.67583 7.61647 4.3932 7.25009L0.430435 2.13452C0.00873756 1.58913 0.396109 0.800097 1.03724 0.800097L8.86276 0.800098C9.50389 0.800098 9.89126 1.58913 9.46957 2.13452L5.5068 7.25009Z"
                    fill="currentColor"
                    className="fill-neutral-90"
                  />
                </svg>
              </button>

              {categoryIds.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {categoryIds.map((id) => {
                    if (id === null) {
                      return (
                        <span
                          key="general"
                          className="inline-flex items-center h-[22px] rounded-full px-3 text-[12px] opacity-80"
                          style={getCategoryStyle(null)}
                        >
                          {NO_CATEGORY_LABEL}
                          <button
                            className="ml-2 w-3 h-3 grid place-items-center"
                            aria-label="remove"
                            onClick={() =>
                              setCategoryIds((prev) => prev.filter((x) => x !== null))
                            }
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
                        </span>
                      );
                    }
                    const category = categoryOptions.find((c) => c.id === id);
                    if (!category) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center h-[22px] rounded-full px-3 text-[12px] opacity-80"
                        style={getCategoryStyle(category.id, category.name, category.colorCode)}
                      >
                        {category.name}
                        <button
                          className="ml-2 w-3 h-3 grid place-items-center"
                          aria-label="remove"
                          onClick={() =>
                            setCategoryIds((prev) => prev.filter((x) => x !== id))
                          }
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
                      </span>
                    );
                  })}
                </div>
              )}

              {categoryOpen && dropdownPosition && typeof window !== "undefined" && createPortal(
                <div
                  ref={dropdownRef}
                  className="fixed z-[200] bg-neutral-0 dark:bg-neutral-10 border border-neutral-30 rounded-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] max-h-[220px] overflow-auto p-3"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                >
                  {/* 일반 옵션 */}
                  <label
                    className={`flex items-center gap-3 h-[34px] px-3 rounded-[5px] border cursor-pointer mb-1 ${
                      categoryIds.includes(null)
                        ? "border-2 border-primary-40 bg-primary-10/30"
                        : "border-border bg-card dark:bg-neutral-10"
                    }`}
                  >
                    <Checkbox
                      checked={categoryIds.includes(null)}
                      onChange={(next) =>
                        setCategoryIds((prev) => {
                          if (next) {
                            return prev.includes(null) ? prev : [...prev, null];
                          } else {
                            return prev.filter((x) => x !== null);
                          }
                        })
                      }
                      ariaLabel={NO_CATEGORY_LABEL}
                    />
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium opacity-80"
                      style={getCategoryStyle(null)}
                    >
                      {NO_CATEGORY_LABEL}
                    </span>
                  </label>
                  {categoryOptions.map((category) => {
                    const checked = categoryIds.includes(category.id);
                    return (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 h-[34px] px-3 rounded-[5px] border cursor-pointer mb-1 last:mb-0 ${
                          checked
                            ? "border-2 border-primary-40 bg-primary-10/30"
                            : "border-border bg-card dark:bg-neutral-10"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onChange={(next) =>
                            setCategoryIds((prev) =>
                              next
                                ? [...prev, category.id]
                                : prev.filter((x) => x !== category.id)
                            )
                          }
                          ariaLabel={category.name}
                        />
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium opacity-80"
                          style={getCategoryStyle(category.id, category.name, category.colorCode)}
                        >
                          {category.name}
                        </span>
                      </label>
                    );
                  })}
                </div>,
                document.body
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 md:px-7 py-3 flex items-center justify-end gap-2 md:gap-3 border-t border-neutral-30">
            <button
              className="cursor-pointer flex-1 md:flex-none md:w-[60px] h-[34px] rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 bg-neutral-0 dark:bg-neutral-10"
              onClick={() => {
                setMessenger("all");
                setCategoryIds([]);
              }}
            >
              초기화
            </button>
            <button
              className="cursor-pointer flex-1 md:flex-none md:w-[72px] h-[34px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em]"
              onClick={() => onApply({ messenger, categoryIds: categoryIds.length > 0 ? categoryIds : undefined })}
            >
              적용완료
            </button>
          </div>
    </BaseModal>
  );
}
