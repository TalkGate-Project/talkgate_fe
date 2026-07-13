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

// GET /v1/analysis/{id}/chat + POST /v1/analysis/{id}/chat/stream 연동.
// analysisId/projectId가 갖춰지면 히스토리를 불러오고, sendMessage로 SSE 스트리밍 응답을 받는다.
export function useDebtReliefAiChat(analysisId: string | null, projectId: string | null) {
  const [messages, setMessages] = useState<DebtReliefChatUiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [analysisId, projectId]);

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

  return { messages, loading, sending, sendMessage };
}
