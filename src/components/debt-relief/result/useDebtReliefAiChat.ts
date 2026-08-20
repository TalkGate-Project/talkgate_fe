"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisService } from "@/services/analysis";
import type { AnalysisChatMessage } from "@/types/analysis";

export type DebtReliefChatMessageStatus = "sent" | "streaming" | "failed";

export type DebtReliefChatUiMessage = {
  localId: string;
  role: "user" | "assistant";
  content: string;
  status: DebtReliefChatMessageStatus;
};

const STREAM_FAILED_FALLBACK_TEXT = "답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.";

function createLocalId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toUiMessage(message: AnalysisChatMessage): DebtReliefChatUiMessage {
  return {
    localId: `server-${message.id}`,
    role: message.role,
    content: message.content,
    status: "sent",
  };
}

export type DebtReliefChatHistory = {
  messages: DebtReliefChatUiMessage[];
  loading: boolean;
  /** 히스토리 조회가 (성공/실패와 무관하게) 한 번이라도 끝났는지. analysisId/projectId가 없으면 계속 false. */
  loaded: boolean;
};

// GET /v1/analysis/{id}/chat 히스토리 조회 전용 훅. 분석 상세 화면에서 채팅 UI(SectionCounselMents)와
// 인쇄용 숨김 문서(AnalysisPrintDocument)가 동시에 마운트돼 있어 각자 이 API를 부르면 중복 호출이 나므로,
// 상위(ResultDetailContent)에서 한 번만 호출해 두 곳에 결과를 내려준다.
export function useDebtReliefChatHistory(
  analysisId: string | null,
  projectId: string | null
): DebtReliefChatHistory {
  const [messages, setMessages] = useState<DebtReliefChatUiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!analysisId || !projectId) return;

    let cancelled = false;
    setLoading(true);

    AnalysisService.chatHistory(Number(analysisId), projectId)
      .then((response) => {
        if (cancelled) return;
        const data = response.data.data;
        // ⚠️ Swagger 예시가 단일 객체로 표기돼 있으나 "히스토리 조회"이므로 배열로 추정 — 방어적으로 처리.
        const items = Array.isArray(data) ? data : data ? [data] : [];
        setMessages(items.map(toUiMessage));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load AI chat history:", error);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [analysisId, projectId]);

  return { messages, loading, loaded };
}

// POST /v1/analysis/{id}/chat/stream 연동. 히스토리는 useDebtReliefChatHistory로 상위에서 받아와
// history로 전달받고, sendMessage로 SSE 스트리밍 응답을 받아 그 위에 이어붙인다.
export function useDebtReliefAiChat(
  analysisId: string | null,
  projectId: string | null,
  history: DebtReliefChatHistory
) {
  const [messages, setMessages] = useState<DebtReliefChatUiMessage[]>(history.messages);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const syncedAnalysisIdRef = useRef<string | null>(null);

  // history.loaded가 처음 true가 되는 시점(analysisId당 1회)에만 히스토리를 반영한다.
  // 매 렌더마다 반영하면 전송 중인/스트리밍 중인 로컬 메시지가 덮어써진다.
  useEffect(() => {
    if (!history.loaded) return;
    if (syncedAnalysisIdRef.current === analysisId) return;
    syncedAnalysisIdRef.current = analysisId;
    setMessages(history.messages);
  }, [analysisId, history.loaded, history.messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || !analysisId || !projectId || sending) return false;

      const userMessage: DebtReliefChatUiMessage = {
        localId: createLocalId(),
        role: "user",
        content: trimmed,
        status: "sent",
      };
      const assistantLocalId = createLocalId();
      const assistantMessage: DebtReliefChatUiMessage = {
        localId: assistantLocalId,
        role: "assistant",
        content: "",
        status: "streaming",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await AnalysisService.streamChatMessage(
          { id: Number(analysisId), projectId, message: trimmed },
          {
            onDelta: (delta) => {
              setMessages((prev) =>
                prev.map((message) =>
                  message.localId === assistantLocalId
                    ? { ...message, content: message.content + delta }
                    : message
                )
              );
            },
            onDone: () => {
              setMessages((prev) =>
                prev.map((message) =>
                  message.localId === assistantLocalId ? { ...message, status: "sent" } : message
                )
              );
            },
          },
          controller.signal
        );
        return true;
      } catch (error) {
        // 언마운트 시 abortRef.current.abort()로 의도적으로 취소된 요청은 실패가 아니므로
        // "답변을 가져오지 못했습니다" 상태로 덮어쓰지 않는다.
        if (error instanceof DOMException && error.name === "AbortError") {
          return false;
        }

        console.error("Failed to stream AI chat message:", error);
        setMessages((prev) =>
          prev.map((message) =>
            message.localId === assistantLocalId
              ? { ...message, status: "failed", content: message.content || STREAM_FAILED_FALLBACK_TEXT }
              : message
          )
        );
        return false;
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [analysisId, projectId, sending]
  );

  return { messages, loading: history.loading, sending, sendMessage };
}
