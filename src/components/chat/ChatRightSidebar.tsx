"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationsService } from "@/services/conversations";
import type { AiAssistantMessage } from "@/types/conversations";
import SendIcon from "./icons/SendIcon";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Image from "next/image";
import { showErrorModal } from "@/lib/errorModalEvents";

type Props = {
  projectId: number;
  conversationId: number | null;
  isResizable?: boolean; // 리사이저 모드일 때 고정 너비 클래스 제거
};

export default function ChatRightSidebar({ projectId, conversationId, isResizable = false }: Props) {
  const [messages, setMessages] = useState<AiAssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

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

  // pendingPrompt가 변경되면 스크롤을 바닥으로 이동
  useEffect(() => {
    if (pendingPrompt) {
      setTimeout(scrollToBottom, 50);
    }
  }, [pendingPrompt, scrollToBottom]);

  // 모바일에서 외부 클릭 시 툴팁 닫기
  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(target) &&
        !(e.target as HTMLElement).closest('[data-tooltip-trigger]')
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showTooltip]);

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
    setPendingPrompt(prompt);
    setInput("");
    // 스크롤을 먼저 바닥으로 이동 (로딩 말풍선이 보이도록)
    setTimeout(scrollToBottom, 50);
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
        setPendingPrompt(null);
        // 응답 후 스크롤 바닥으로
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      const errorCode = err?.data?.code;
      const errorStatus = err?.status;
      
      // 403 + AI_USAGE_LIMIT_EXCEEDED: 사용량 한도 초과
      if (errorStatus === 403 && errorCode === "AI_USAGE_LIMIT_EXCEEDED") {
        showErrorModal({
          type: "error",
          headline: "현재 요금제의 사용량 한도에 도달했습니다.",
          hideCancel: true,
        });
        setPendingPrompt(null);
        return;
      }
      
      const msg =
        err?.data?.message ||
        err?.message ||
        "AI 상담 도우미에게 질문하지 못했습니다.";
      setError(msg);
      setPendingPrompt(null);
    } finally {
      setSending(false);
    }
  }, [conversationId, input, projectId, sending, scrollToBottom]);

  return (
    <div className={`w-full ${isResizable ? "" : "md:max-w-[286px]"} h-full rounded-[14px] bg-card dark:bg-neutral-0 flex flex-col min-h-0`}>
      <div className="px-4 md:px-7 py-4 md:py-5 flex items-center justify-between border-b border-border dark:border-neutral-30 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Image src="/icon-ai.png" alt="Talkgate" width={18} height={22} />
            <h3 className="text-[18px] md:text-[20px] font-bold">Talkgate AI</h3>
            <span className="inline-block w-2 h-2 rounded-full bg-primary-60" />
          </div>
          <div className="relative">
            <div
              data-tooltip-trigger
              className="cursor-pointer flex items-center justify-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onTouchStart={(e) => {
                e.stopPropagation();
                setShowTooltip((prev) => !prev);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {showTooltip && (
              <div
                ref={tooltipRef}
                className="absolute right-0 top-full mt-2 z-50 w-[280px] md:w-[320px] bg-card dark:bg-neutral-10 border border-border dark:border-neutral-30 rounded-[8px] shadow-lg p-4 text-[12px] leading-[18px] text-foreground"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-2">
                  <p>
                    상담자의 편의를 위해 AI 기반 검색 기술을 활용하여 필요한 정보를 제공하는 답변입니다.
                  </p>
                  <p>
                    학습된 내용을 기반으로 AI 모델이 요약한 결과물로서 해당 과정에서 다소 부정확, 부적절한 정보가 포함될 수 있습니다.
                    Talkgate AI의 답변은 참고용으로만 사용해주시고, 의료, 법률, 금융 등 전문적인 자문이 필요한 경우 해당 분야의 전문가에게 문의하세요.
                  </p>
                  <p>
                    또한 Talkgate AI가 제공하는 답변은 일반적인 정보 제공을 목적으로 하며, 투자 권유, 투자 자문 또는 금융상품에 대한 매수·매도 추천이 아닙니다.
                  </p>
                  <p>
                    본 답변은 특정 개인의 투자 목적, 재무 상태, 위험 선호도를 고려하지 않으며, 투자 판단에 대한 최종 책임은 이용자에게 있습니다.
                  </p>
                  <p>
                    Talkgate 및 주식회사 핑크코브라는 AI 답변의 내용으로 발생한 투자 손실 또는 법적 책임을 부담하지 않습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("close-ai-sidebar"));
            }
          }}
          className="md:hidden cursor-pointer p-1"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-7 py-4 space-y-3 min-h-0"
        ref={messagesScrollRef}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {!hasActiveConversation ? (
          <div className="text-[13px] leading-[20px] text-neutral-60 h-full flex items-center justify-center text-center">
            상담에 도움이 필요하시면 언제든
            <br />
            AI에게 질문하세요.
          </div>
        ) : (
          <>
            {/* <div className="flex justify-start">
              <div className="max-w-[85%] bg-neutral-20 text-ink rounded-[16px] rounded-bl-none px-4 py-3">
                <div className="text-[13px] leading-[20px]">
                  본 AI가 제공하는 답변은 일반적인 정보 제공을 목적으로 하며,
                  <br />
                  투자 권유, 투자 자문 또는 금융상품에 대한 매수·매도 추천이 아닙니다.
                  <br />
                  <br />
                  본 답변은 특정 개인의 투자 목적, 재무 상태, 위험 선호도를
                  <br />
                  고려하지 않으며, 투자 판단에 대한 최종 책임은 이용자에게 있습니다.
                  <br />
                  <br />
                  Talkgate 및 주식회사 핑크코브라는
                  <br />
                  AI 답변의 내용으로 발생한 투자 손실 또는 법적 책임을 부담하지 않습니다.
                </div>
              </div>
            </div> */}

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
                  {/* 전송 중인 질문과 로딩 말풍선 */}
                  {pendingPrompt && (
                    <div className="space-y-3">
                      {/* 나의 질문 (outgoing) */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-neutral-90 text-neutral-0 rounded-[16px] rounded-br-none px-4 py-3">
                          <div className="text-[13px] leading-[20px] whitespace-pre-wrap break-words">
                            {pendingPrompt}
                          </div>
                          <div className="mt-2 text-[12px] text-[#B0B0B0]">
                            {formatMessageTime(new Date().toISOString())}
                          </div>
                        </div>
                      </div>
                      {/* AI 응답 대기 중 로딩 말풍선 */}
                      <div className="flex justify-start">
                        <div className="max-w-[85%] bg-neutral-20 text-ink rounded-[16px] rounded-bl-none px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-neutral-60 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-neutral-60 animate-bounce"
                              style={{ animationDelay: "200ms" }}
                            />
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-neutral-60 animate-bounce"
                              style={{ animationDelay: "400ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="h-[76px] px-3 md:px-4 border-t border-border dark:border-neutral-30 shrink-0 md:relative md:bottom-auto">
        <div className="h-full flex items-center gap-2">
          <textarea
            className="flex-1 h-[40px] px-2 md:px-3 text-[14px] outline-none bg-transparent border-0 disabled:cursor-not-allowed resize-none leading-[20px] py-[10px]"
            placeholder={
              hasActiveConversation
                ? "메세지를 입력하세요."
                : "상담 채팅을 먼저 선택해주세요."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
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
