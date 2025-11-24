"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationsService } from "@/services/conversations";
import type { AiAssistantMessage } from "@/types/conversations";
import SendIcon from "./icons/SendIcon";

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

  const hasActiveConversation = useMemo(() => !!conversationId, [conversationId]);

  // 스크롤 하단 고정
  const scrollToBottom = useCallback(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
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
        const olderMessages = items.reverse().filter(it => !existingIds.has(it.id));
        return [...olderMessages, ...prev];
      });
      setNextCursor(data?.nextCursor);
      setHasMore(Boolean(data?.hasMore));

      // 스크롤 위치 복원 (새로운 아이템 높이만큼 아래로)
      requestAnimationFrame(() => {
        if (scrollContainer) {
          const newScrollHeight = scrollContainer.scrollHeight;
          scrollContainer.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
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
    <div className="max-w-[286px] h-full rounded-[14px] bg-card dark:bg-neutral-0 border border-border dark:border-neutral-30 flex flex-col">
      <div className="px-4 py-4.5 flex items-center justify-between border-b border-border dark:border-neutral-30">
        <div className="flex items-center gap-2">
          <h3 className="text-[20px] font-bold">AI상담도우미</h3>
          <span className="inline-block w-2 h-2 rounded-full bg-primary-60" />
        </div>
        <button
          className="h-[34px] px-4 rounded-[5px] bg-neutral-90 text-neutral-40 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          disabled={!hasActiveConversation}
        >
          완료
        </button>
      </div>

      <div
        className="flex-1 overflow-auto p-4 space-y-3"
        ref={messagesScrollRef}
      >
        {!hasActiveConversation ? (
          <div className="text-[13px] leading-[20px] text-neutral-60">
            왼쪽에서 상담 채팅을 선택하면 AI 상담 도우미를 사용할 수 있습니다.
          </div>
        ) : (
          <>
            <div className="max-w-[85%] bg-neutral-20 text-ink rounded-[16px] rounded-tl-none px-5 py-4">
              <div className="text-[13px] leading-[20px]">
                AI 상담 도우미와의 대화 내역입니다. 상담 중 모르는 내용이 있으면
                아래 입력창에 질문을 남겨보세요.
              </div>
            </div>

            {error && (
              <div className="text-[12px] text-danger-60 bg-danger-10 border border-danger-20 rounded-[8px] px-3 py-2">
                {error}
              </div>
            )}

            {loading && messages.length === 0 ? (
              <div className="flex justify-center py-4">
                <svg
                  className="animate-spin h-6 w-6 text-primary-60"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-[13px] text-neutral-60">
                아직 AI 상담 도우미와의 대화가 없습니다. 첫 질문을 남겨보세요.
              </div>
            ) : (
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
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div className="max-w-[85%] ml-auto bg-neutral-90 text-neutral-0 rounded-[16px] rounded-br-none px-4 py-3">
                        <div className="text-[12px] text-neutral-40 mb-1">나의 질문</div>
                        <div className="text-[13px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.prompt}
                        </div>
                      </div>
                      <div className="max-w-[85%] bg-neutral-20 text-ink rounded-[16px] rounded-tl-none px-4 py-3">
                        <div className="text-[12px] text-neutral-60 mb-1">AI 답변</div>
                        <div className="text-[13px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.response}
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
                ? "AI 도우미에게 물어볼 내용을 입력하세요."
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
