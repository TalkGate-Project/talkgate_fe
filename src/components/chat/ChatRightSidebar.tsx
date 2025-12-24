"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationsService } from "@/services/conversations";
import type { AiAssistantMessage } from "@/types/conversations";
import SendIcon from "./icons/SendIcon";
import LoadingSpinner from "@/components/common/LoadingSpinner";

type Props = {
  projectId: number;
  conversationId: number | null;
};

export default function ChatRightSidebar({ projectId, conversationId }: Props) {
  const [messages, setMessages] = useState<AiAssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);

  const hasActiveConversation = useMemo(
    () => !!conversationId,
    [conversationId]
  );

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "오후" : "오전";
    const hour12 = hours % 12 || 12;

    return `${month}. ${day}. ${ampm} ${hour12}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 스크롤 하단 고정
  const scrollToBottom = useCallback(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop =
        messagesScrollRef.current.scrollHeight;
    }
  }, []);

  // 대화방 변경 시 AI 도우미 대화 목록 조회
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setNextCursor(undefined);
      setHasMore(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ConversationsService.listAiAssistant({
          conversationId,
          projectId: String(projectId),
          limit: 20,
        });
        if (cancelled) return;
        const payload = res.data as any;
        const data = payload?.data;
        const items = (data?.conversations ?? []) as AiAssistantMessage[];

        // items는 보통 최신순(내림차순)으로 옴 -> 렌더링은 오래된순(오름차순)으로 할 것이므로 뒤집음
        // 백엔드 응답이 [최신, ..., 오래된] 이라고 가정
        setMessages(items.reverse());
        setNextCursor(data?.nextCursor);
        setHasMore(Boolean(data?.hasMore));
        // 초기 로드 후 스크롤 바닥으로
        setTimeout(scrollToBottom, 100);
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err?.data?.message ||
          err?.message ||
          "AI 상담 도우미 대화 내역을 불러오지 못했습니다.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [conversationId, projectId, scrollToBottom]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading) return;
    // 현재 스크롤 위치 저장
    const scrollContainer = messagesScrollRef.current;
    const prevScrollHeight = scrollContainer?.scrollHeight ?? 0;
    const prevScrollTop = scrollContainer?.scrollTop ?? 0;

    try {
      const res = await ConversationsService.listAiAssistant({
        conversationId,
        projectId: String(projectId),
        limit: 20,
        cursor: nextCursor,
      });
      const payload = res.data as any;
      const data = payload?.data;
      const items = (data?.conversations ?? []) as AiAssistantMessage[];

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        // items (최신->오래된) reverse -> (오래된->최신)
        // 이전 메시지들이므로 앞에 붙임
        const olderMessages = items
          .reverse()
          .filter((it) => !existingIds.has(it.id));
        return [...olderMessages, ...prev];
      });
      setNextCursor(data?.nextCursor);
      setHasMore(Boolean(data?.hasMore));

      // 스크롤 위치 복원 (새로운 아이템 높이만큼 아래로)
      requestAnimationFrame(() => {
        if (scrollContainer) {
          const newScrollHeight = scrollContainer.scrollHeight;
          scrollContainer.scrollTop =
            newScrollHeight - prevScrollHeight + prevScrollTop;
        }
      });
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "이전 AI 상담 내역을 불러오지 못했습니다.";
      setError(msg);
    }
  }, [conversationId, hasMore, loading, nextCursor, projectId]);

  const handleSend = useCallback(async () => {
    if (!conversationId || !input.trim() || sending) return;
    setSending(true);
    setError(null);
    const prompt = input.trim();
    try {
      const res = await ConversationsService.askAiAssistant({
        conversationId,
        projectId: String(projectId),
        prompt,
      });
      const payload = res.data as any;
      const data = payload?.data as AiAssistantMessage | undefined;
      if (data) {
        // 새 메시지를 뒤에 추가 (오래된 -> 최신)
        setMessages((prev) => [...prev, data]);
        setInput("");
        // 전송 후 스크롤 바닥으로
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "AI 상담 도우미에게 질문하지 못했습니다.";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [conversationId, input, projectId, sending, scrollToBottom]);

  return (
    <div className="max-w-[286px] h-full rounded-[14px] bg-card dark:bg-neutral-0 flex flex-col">
      <div className="px-7 py-5 flex items-center justify-between border-b border-border dark:border-neutral-30">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="22"
            viewBox="0 0 18 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="18"
              height="22.0002"
              rx="9"
              fill="white"
              fill-opacity="0.5"
            />
            <path
              d="M9.38407 17.6434L9.37564 17.6447L9.3257 17.6672L9.31164 17.6697L9.30179 17.6672L9.25186 17.6441C9.24436 17.6423 9.23873 17.6436 9.23498 17.6479L9.23217 17.6543L9.22021 17.929L9.22373 17.9418L9.23076 17.9502L9.3039 17.9977L9.31445 18.0002L9.32289 17.9977L9.39603 17.9502L9.40447 17.9399L9.40728 17.929L9.39533 17.655C9.39345 17.6481 9.3897 17.6443 9.38407 17.6434ZM9.56974 17.5709L9.55989 17.5722L9.43049 17.6319L9.42346 17.6383L9.42135 17.6453L9.43401 17.9213L9.43752 17.929L9.44315 17.9341L9.58451 17.9932C9.59342 17.9953 9.60022 17.9936 9.60491 17.9881L9.60772 17.9791L9.58381 17.585C9.58146 17.5769 9.57677 17.5722 9.56974 17.5709ZM9.06689 17.5722C9.0638 17.5705 9.06009 17.5699 9.05655 17.5706C9.05302 17.5713 9.04992 17.5733 9.04791 17.576L9.04369 17.585L9.01978 17.9791C9.02024 17.9868 9.02423 17.9919 9.03173 17.9945L9.04228 17.9932L9.18364 17.9335L9.19067 17.9284L9.19278 17.9213L9.20544 17.6453L9.20333 17.6376L9.1963 17.6312L9.06689 17.5722Z"
              fill="url(#paint0_linear_3287_32336)"
            />
            <path
              d="M6.93167 6.21289C7.35223 5.08976 9.05277 5.05574 9.55139 6.11085L9.59359 6.21353L10.1611 7.72816C10.2912 8.07551 10.5014 8.39338 10.7775 8.66031C11.0536 8.92724 11.3893 9.13702 11.7618 9.27551L11.9144 9.3275L13.5742 9.84478C14.8049 10.2286 14.8422 11.7804 13.6867 12.2354L13.5742 12.274L11.9144 12.7919C11.5336 12.9105 11.1852 13.1023 10.8926 13.3543C10.5999 13.6062 10.3699 13.9126 10.2181 14.2526L10.1611 14.3912L9.59429 15.9065C9.17373 17.0296 7.4732 17.0636 6.97528 16.0092L6.93167 15.9065L6.36483 14.3919C6.23485 14.0444 6.0247 13.7264 5.74857 13.4594C5.47244 13.1923 5.13675 12.9824 4.76416 12.8439L4.61225 12.7919L2.95251 12.2746C1.72106 11.8908 1.68379 10.339 2.83998 9.88457L2.95251 9.84478L4.61225 9.3275C4.99289 9.2088 5.34121 9.01699 5.63371 8.76501C5.92622 8.51303 6.1561 8.20673 6.30786 7.86678L6.36483 7.72816L6.93167 6.21289ZM13.8892 4C14.0208 4 14.1497 4.03368 14.2614 4.09721C14.373 4.16075 14.4629 4.25158 14.5208 4.3594L14.5545 4.43449L14.8007 5.09297L15.523 5.31759C15.6548 5.35847 15.7704 5.43415 15.8551 5.53504C15.9397 5.63593 15.9897 5.75749 15.9986 5.88431C16.0075 6.01113 15.9749 6.1375 15.905 6.24741C15.8351 6.35732 15.731 6.44582 15.6059 6.5017L15.523 6.5325L14.8014 6.75713L14.5552 7.41625C14.5104 7.53654 14.4274 7.64196 14.3168 7.71917C14.2062 7.79637 14.073 7.84188 13.934 7.84992C13.795 7.85796 13.6566 7.82818 13.5362 7.76434C13.4158 7.7005 13.3189 7.60549 13.2577 7.49134L13.2239 7.41625L12.9778 6.75777L12.2555 6.53314C12.1237 6.49227 12.0081 6.41659 11.9234 6.3157C11.8387 6.21481 11.7888 6.09325 11.7799 5.96643C11.771 5.83961 11.8036 5.71324 11.8735 5.60333C11.9434 5.49342 12.0475 5.40492 12.1725 5.34904L12.2555 5.31824L12.9771 5.09361L13.2232 4.43449C13.2706 4.30769 13.3604 4.19761 13.4798 4.11969C13.5992 4.04177 13.7424 3.99992 13.8892 4Z"
              fill="url(#paint1_linear_3287_32336)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_3287_32336"
                x1="9.31375"
                y1="17.5703"
                x2="9.31375"
                y2="18.0002"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#00E272" />
                <stop offset="1" stop-color="#A9FFD4" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_3287_32336"
                x1="9"
                y1="4"
                x2="9"
                y2="16.7752"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#00E272" />
                <stop offset="1" stop-color="#A9FFD4" />
              </linearGradient>
            </defs>
          </svg>
          <h3 className="text-[20px] font-bold">Talkgate AI</h3>
          <span className="inline-block w-2 h-2 rounded-full bg-primary-60" />
        </div>
      </div>

      <div
        className="flex-1 overflow-auto px-7 p-4 space-y-3 max-[1439px]:min-h-[200px] max-[1439px]:max-h-[360px]"
        ref={messagesScrollRef}
      >
        {!hasActiveConversation ? (
          <div className="text-[13px] leading-[20px] text-neutral-60 h-full flex items-center justify-center text-center">
            상담에 도움이 필요하시면 언제든
            <br />
            AI에게 질문하세요.
          </div>
        ) : (
          <>
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-neutral-20 text-ink rounded-[16px] rounded-bl-none px-4 py-3">
                <div className="text-[13px] leading-[20px]">
                  Talkgate AI 연결되었습니다.
                  <br />
                  무엇을 도와드릴까요?
                </div>
              </div>
            </div>

            {error && (
              <div className="text-[12px] text-danger-60 bg-danger-10 border border-danger-20 rounded-[8px] px-3 py-2">
                {error}
              </div>
            )}

            {loading && messages.length === 0 && (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}

            {!loading && messages.length > 0 && (
              <>
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="cursor-pointer text-[12px] text-primary-80 underline mb-2 disabled:opacity-50 disabled:cursor-not-allowed block mx-auto"
                    disabled={loading}
                  >
                    이전 AI 상담 내역 더 보기
                  </button>
                )}
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className="space-y-3">
                      {/* 나의 질문 (outgoing) */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-neutral-90 text-neutral-0 rounded-[16px] rounded-br-none px-4 py-3">
                          <div className="text-[13px] leading-[20px] whitespace-pre-wrap break-words">
                            {m.prompt}
                          </div>
                          <div className="mt-2 text-[12px] text-[#B0B0B0]">
                            {formatMessageTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                      {/* AI 답변 (incoming) */}
                      <div className="flex justify-start">
                        <div className="max-w-[85%] bg-neutral-20 text-ink rounded-[16px] rounded-bl-none px-4 py-3">
                          <div className="text-[13px] leading-[20px] whitespace-pre-wrap break-words">
                            {m.response}
                          </div>
                          <div className="mt-2 text-[12px] text-[#B0B0B0]">
                            {formatMessageTime(m.updatedAt || m.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="h-[76px] px-4 border-t border-border dark:border-neutral-30">
        <div className="h-full flex items-center gap-2">
          <input
            className="flex-1 h-[40px] px-3 text-[14px] outline-none bg-transparent border-0 disabled:cursor-not-allowed"
            placeholder={
              hasActiveConversation
                ? "메세지를 입력하세요."
                : "상담 채팅을 먼저 선택해주세요."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={!hasActiveConversation || sending}
          />
          <button
            className="w-[34px] h-[34px] grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="send-ai-assistant"
            type="button"
            onClick={() => void handleSend()}
            disabled={!hasActiveConversation || !input.trim() || sending}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
