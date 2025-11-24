import React, { useState, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { SelectField } from "./SelectField";
import { formatDetailDate } from "./utils";
import { CustomerDetail } from "@/types/customers";

type Props = {
  customerName: string;
  conversation: CustomerDetail["conversation"];
  notes: CustomerDetail["notes"];
  categories: { id: number; name: string; color?: string }[];
  onAddNote: (categoryId: number | undefined, note: string) => void;
  onRemoveNote: (id: number) => void;
  customerId: number;
};

// Define the 5 badge styles based on the user's request
const BADGE_STYLES = [
  { bg: "bg-[#FFEBEB]", text: "text-[#D83232]" }, // 1. Red (부재, etc.)
  { bg: "bg-[#FFF5D5]", text: "text-[#976400]" }, // 2. Yellow (재상담, etc.)
  { bg: "bg-[#E2E2E2]", text: "text-[#595959]" }, // 3. Gray (AS요청, etc.)
  { bg: "bg-[#D3E1FE]", text: "text-[#4D82F3]" }, // 4. Blue (무료방안내, etc.)
  { bg: "bg-[#D6FAE8]", text: "text-[#00B55B]" }, // 5. Green (결제완료, etc.)
];

function getBadgeStyle(name: string, id: number) {
  // Normalize name for matching
  const n = name.trim();

  // 1. Red (부재)
  if (n.includes("부재") || n.includes("중요") || n.includes("긴급") || n.includes("에러") || n.includes("실패") || n.includes("취소")) {
    return BADGE_STYLES[0];
  }

  // 2. Yellow (재상담)
  if (n.includes("재상담") || n.includes("주의") || n.includes("경고") || n.includes("보류") || n.includes("대기")) {
    return BADGE_STYLES[1];
  }

  // 3. Gray (AS요청)
  // Note: "AS요청" contains "요청" which might trigger Green if checked later, so checking "AS" first or "AS요청" specifically.
  if (n.includes("AS") || n.includes("보통") || n.includes("일반") || n.includes("기타")) {
    return BADGE_STYLES[2];
  }

  // 4. Blue (무료방안내)
  if (n.includes("방안내") || n.includes("안내") || n.includes("양호") || n.includes("승인")) {
    return BADGE_STYLES[3];
  }

  // 5. Green (결제완료)
  // "요청" is ambiguous but typically Green/Blue. Putting "요청" here unless it's AS.
  if (n.includes("결제") || n.includes("완료") || n.includes("성공") || n.includes("해결") || n.includes("필요") || n.includes("요청") || n.includes("문의")) {
    return BADGE_STYLES[4];
  }

  // Fallback: Deterministic mapping by ID
  if (!id) return BADGE_STYLES[2]; // Default to Gray
  return BADGE_STYLES[id % BADGE_STYLES.length];
}

export default function ConsultationPanel({
  customerName,
  conversation,
  notes,
  categories,
  onAddNote,
  onRemoveNote,
  customerId,
}: Props) {
  const router = useRouter();
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
    const catId = typeof noteCategoryId === "number" ? noteCategoryId : undefined;
    onAddNote(catId, noteInput.trim());
    setNoteInput("");
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

  return (
    <div className="col-span-12 lg:col-span-4">
      {/* Conversation Card */}
      <div className="mb-[30px] border border-[#E2E2E2] rounded-[5px] bg-[#F8F8F8] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-neutral-30 overflow-hidden flex-shrink-0">
            {hasConversation && conversation!.profileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conversation!.profileUrl as string}
                alt={conversation!.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[18px] font-semibold text-foreground">
                {(conversation?.name || customerName || "홍").charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-foreground truncate">
              {hasConversation
                ? conversation!.name || `${customerName}님과의 채팅`
                : `${customerName || "홍길동"}님과의 채팅`}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[14px] text-neutral-60">
              {hasConversation && conversation!.platform === "instagram" && (
                <span className="w-4 h-4 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/platform/instagram.png"
                    alt="Instagram"
                    className="w-full h-full object-contain"
                  />
                </span>
              )}
              {hasConversation && conversation!.platform === "telegram" && (
                <span className="w-4 h-4 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/platform/telegram.png"
                    alt="Telegram"
                    className="w-full h-full object-contain"
                  />
                </span>
              )}
              {hasConversation && conversation!.platform === "line" && (
                <span className="w-4 h-4 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <button
          type="button"
          disabled={!hasConversation}
          className={`flex items-center justify-center w-[34px] h-[34px] rounded-[5px] border ${
            hasConversation
              ? "bg-primary-10 border-primary-80 cursor-pointer"
              : "bg-neutral-10 border-neutral-30 cursor-not-allowed"
          }`}
          onClick={() => {
            if (!hasConversation) return;
            const c = conversation!;
            const params = new URLSearchParams();
            params.set("conversationId", String(c.id));
            params.set("platform", c.platform);
            params.set("customerId", String(customerId));
            router.push(`/consult?${params.toString()}`);
          }}
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
              stroke={hasConversation ? "#00B55B" : "#B0B0B0"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Consultation Notes */}
      <div className="text-[16px] font-semibold text-neutral-90 mb-3">
        상담 내용 기록
      </div>
      <div className="border-b border-[#E2E2E2] mb-2" />
      <div className="">
        <p className="text-body-3 text-neutral-60 mb-2">상담 카테고리</p>
        <div className="flex gap-2 mb-5">
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
            placeholder="상담 내용을 입력하세요"
            className="flex-1 h-[34px] rounded-[5px] border border-[#E5E7EB] px-3 text-body-3"
          />
          <button
            className="cursor-pointer w-[48px] h-[34px] text-body-3 rounded-[5px] bg-neutral-90 text-neutral-40"
            onClick={handleAddNote}
          >
            추가
          </button>
        </div>

        <div
          ref={scrollRef}
          className="space-y-3 overflow-auto pr-1 border border-[#E2E2E2] rounded-[5px] max-h-[210px] p-5"
        >
          {notes?.map((n) => {
            const category = categories.find((c) => c.id === n.categoryId);
            const categoryName = category?.name || "일반";
            const badgeStyle = getBadgeStyle(categoryName, n.categoryId || 0);

            return (
              <div
                key={n.id}
                className="bg-neutral-10 rounded-[12px] px-4 py-3 relative"
              >
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-x-2">
                    <div
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-[30px] ${badgeStyle.bg} ${badgeStyle.text}`}
                    >
                      {categoryName}
                    </div>
                    {/* 노트를 작성한 담당자 이름이 우선, 없으면 고객 이름을 표시 */}
                    <span className="text-[12px] text-neutral-80">
                      {n.memberName || customerName}
                    </span>
                  </div>
                  <div className="text-neutral-60 flex gap-x-3 items-center justify-end">
                    <span className="text-right">
                      {formatDetailDate(n.createdAt)}
                    </span>
                    <button
                      className="cursor-pointer w-5 h-5 grid place-items-center rounded-full bg-black text-white"
                      onClick={() => onRemoveNote(n.id)}
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
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[14px] text-neutral-70">{n.note}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
