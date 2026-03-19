"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/lib/env";
import { showErrorModal } from "@/lib/errorModalEvents";
import { ConversationsService } from "@/services/conversations";
import type { AiAssistantMessage } from "@/types/conversations";

export type AiAssistantMessageStatus =
  | "sent"
  | "sending"
  | "retrying"
  | "failed"
  | "canceled";

export type AiAssistantErrorKind =
  | "timeout"
  | "canceled"
  | "network"
  | "limit"
  | "unknown";

export type AiAssistantUiMessage = {
  localId: string;
  serverId?: number;
  prompt: string;
  response?: string;
  createdAt: string;
  updatedAt?: string;
  status: AiAssistantMessageStatus;
  errorKind?: AiAssistantErrorKind;
};

type ConversationPanelState = {
  messages: AiAssistantUiMessage[];
  loading: boolean;
  loadingMore: boolean;
  initialized: boolean;
  error: string | null;
  nextCursor?: number;
  hasMore: boolean;
};

type UseAiAssistantPanelParams = {
  projectId: number;
  conversationId: number | null;
};

type PendingRequest = {
  controller: AbortController;
  timeoutId: number;
};

const INITIAL_LOAD_ERROR_MESSAGE =
  "AI 상담 도우미 대화 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
const LOAD_MORE_ERROR_MESSAGE =
  "이전 AI 상담 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

function createDefaultConversationState(): ConversationPanelState {
  return {
    messages: [],
    loading: false,
    loadingMore: false,
    initialized: false,
    error: null,
    nextCursor: undefined,
    hasMore: false,
  };
}

function createLocalId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isLikelySameMessage(
  localMessage: AiAssistantUiMessage,
  serverMessage: AiAssistantUiMessage
): boolean {
  if (localMessage.prompt.trim() !== serverMessage.prompt.trim()) {
    return false;
  }

  const localCreatedAt = new Date(localMessage.createdAt).getTime();
  const serverCreatedAt = new Date(serverMessage.createdAt).getTime();

  if (
    Number.isNaN(localCreatedAt) ||
    Number.isNaN(serverCreatedAt)
  ) {
    return false;
  }

  const timeDiff = Math.abs(serverCreatedAt - localCreatedAt);
  return timeDiff <= 2 * 60 * 1000;
}

function toUiMessage(message: AiAssistantMessage): AiAssistantUiMessage {
  return {
    localId: `server-${message.id}`,
    serverId: message.id,
    prompt: message.prompt,
    response: message.response,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    status: "sent",
  };
}

function replaceLocalWithServerMessage(
  messages: AiAssistantUiMessage[],
  localId: string,
  serverMessage: AiAssistantMessage
): AiAssistantUiMessage[] {
  const nextServerMessage = toUiMessage(serverMessage);
  const matchIndex = messages.findIndex((message) => message.localId === localId);

  if (matchIndex === -1) {
    return [...messages, nextServerMessage];
  }

  const nextMessages = [...messages];
  nextMessages[matchIndex] = nextServerMessage;
  return nextMessages;
}

function mergeInitialMessages(
  previousMessages: AiAssistantUiMessage[],
  nextMessages: AiAssistantMessage[]
): AiAssistantUiMessage[] {
  const serverMessages = previousMessages.filter(
    (message) => message.serverId != null
  );
  const localMessages = previousMessages.filter(
    (message) => message.serverId == null
  );
  const loadedServerMessages = nextMessages.map(toUiMessage);
  const loadedIds = new Set(
    loadedServerMessages.map((message) => message.serverId as number)
  );
  const optimisticServerMessages = serverMessages.filter(
    (message) => !loadedIds.has(message.serverId as number)
  );
  const matchedServerMessageIds = new Set<string>();
  const unresolvedLocalMessages = localMessages.filter((localMessage) => {
    const matchedServerMessage = loadedServerMessages.find((serverMessage) => {
      if (matchedServerMessageIds.has(serverMessage.localId)) {
        return false;
      }

      return isLikelySameMessage(localMessage, serverMessage);
    });

    if (!matchedServerMessage) {
      return true;
    }

    matchedServerMessageIds.add(matchedServerMessage.localId);
    return false;
  });

  return [
    ...loadedServerMessages,
    ...optimisticServerMessages,
    ...unresolvedLocalMessages,
  ];
}

function prependOlderMessages(
  previousMessages: AiAssistantUiMessage[],
  olderMessages: AiAssistantMessage[]
): AiAssistantUiMessage[] {
  const serverMessages = previousMessages.filter(
    (message) => message.serverId != null
  );
  const localMessages = previousMessages.filter(
    (message) => message.serverId == null
  );
  const existingIds = new Set(
    serverMessages.map((message) => message.serverId as number)
  );
  const nextOlderMessages = olderMessages
    .map(toUiMessage)
    .filter((message) => !existingIds.has(message.serverId as number));

  return [...nextOlderMessages, ...serverMessages, ...localMessages];
}

function classifySendError(
  error: unknown,
  signal: AbortSignal
): AiAssistantErrorKind {
  const typedError = error as {
    name?: string;
    message?: string;
    status?: number;
    data?: { code?: string };
  };

  if (typedError?.status === 403 && typedError?.data?.code === "AI_USAGE_LIMIT_EXCEEDED") {
    return "limit";
  }

  const abortSignal = signal as AbortSignal & { reason?: unknown };
  const reason = abortSignal.reason as { name?: string } | undefined;

  if (abortSignal.aborted) {
    if (reason?.name === "TimeoutError") {
      return "timeout";
    }
    return "canceled";
  }

  if (typedError?.name === "AbortError") {
    return "canceled";
  }

  const message = String(typedError?.message ?? "").toLowerCase();
  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("fetch")
  ) {
    return "network";
  }

  return "unknown";
}

export function useAiAssistantPanel({
  projectId,
  conversationId,
}: UseAiAssistantPanelParams) {
  const [statesByConversation, setStatesByConversation] = useState<
    Record<number, ConversationPanelState>
  >({});
  const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
  const statesByConversationRef = useRef<Record<number, ConversationPanelState>>(
    {}
  );

  statesByConversationRef.current = statesByConversation;

  const setConversationState = useCallback(
    (
      targetConversationId: number,
      updater: (state: ConversationPanelState) => ConversationPanelState
    ) => {
      setStatesByConversation((previousStates) => {
        const previousState =
          previousStates[targetConversationId] ?? createDefaultConversationState();
        const nextState = updater(previousState);

        if (previousState === nextState) {
          return previousStates;
        }

        return {
          ...previousStates,
          [targetConversationId]: nextState,
        };
      });
    },
    []
  );

  const clearPendingRequest = useCallback((localId: string) => {
    const pendingRequest = pendingRequestsRef.current.get(localId);
    if (!pendingRequest) return;

    window.clearTimeout(pendingRequest.timeoutId);
    pendingRequestsRef.current.delete(localId);
  }, []);

  useEffect(() => {
    setStatesByConversation({});
    pendingRequestsRef.current.forEach(({ controller, timeoutId }) => {
      window.clearTimeout(timeoutId);
      controller.abort();
    });
    pendingRequestsRef.current.clear();
  }, [projectId]);

  useEffect(() => {
    const pendingRequests = pendingRequestsRef.current;

    return () => {
      pendingRequests.forEach(({ controller, timeoutId }) => {
        window.clearTimeout(timeoutId);
        controller.abort();
      });
      pendingRequests.clear();
    };
  }, []);

  const currentState = useMemo(() => {
    if (!conversationId) {
      return createDefaultConversationState();
    }

    return (
      statesByConversation[conversationId] ?? createDefaultConversationState()
    );
  }, [conversationId, statesByConversation]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const conversationState = statesByConversationRef.current[conversationId];
    if (conversationState?.initialized || conversationState?.loading) {
      return;
    }

    let disposed = false;

    setConversationState(conversationId, (previousState) => ({
      ...previousState,
      loading: true,
      initialized: true,
      error: null,
    }));

    const run = async () => {
      try {
        const response = await ConversationsService.listAiAssistant({
          conversationId,
          projectId: String(projectId),
          limit: 20,
        });

        if (disposed) return;

        const payload = response.data as { data?: { conversations?: AiAssistantMessage[]; nextCursor?: number; hasMore?: boolean } };
        const items = (payload.data?.conversations ?? []).reverse();

        setConversationState(conversationId, (previousState) => ({
          ...previousState,
          loading: false,
          error: null,
          messages: mergeInitialMessages(previousState.messages, items),
          nextCursor: payload.data?.nextCursor,
          hasMore: Boolean(payload.data?.hasMore),
        }));
      } catch (error) {
        if (disposed) return;

        console.error("Failed to load AI assistant history:", error);
        setConversationState(conversationId, (previousState) => ({
          ...previousState,
          loading: false,
          error: INITIAL_LOAD_ERROR_MESSAGE,
        }));
      }
    };

    void run();

    return () => {
      disposed = true;
    };
  }, [
    conversationId,
    projectId,
    setConversationState,
  ]);

  const loadMore = useCallback(async () => {
    if (!conversationId) return;

    const state = statesByConversation[conversationId] ?? createDefaultConversationState();
    if (!state.hasMore || state.loading || state.loadingMore) {
      return;
    }

    setConversationState(conversationId, (previousState) => ({
      ...previousState,
      loadingMore: true,
      error: null,
    }));

    try {
      const response = await ConversationsService.listAiAssistant({
        conversationId,
        projectId: String(projectId),
        limit: 20,
        cursor: state.nextCursor,
      });
      const payload = response.data as { data?: { conversations?: AiAssistantMessage[]; nextCursor?: number; hasMore?: boolean } };
      const items = (payload.data?.conversations ?? []).reverse();

      setConversationState(conversationId, (previousState) => ({
        ...previousState,
        loadingMore: false,
        messages: prependOlderMessages(previousState.messages, items),
        nextCursor: payload.data?.nextCursor,
        hasMore: Boolean(payload.data?.hasMore),
      }));
    } catch (error) {
      console.error("Failed to load older AI assistant history:", error);
      setConversationState(conversationId, (previousState) => ({
        ...previousState,
        loadingMore: false,
        error: LOAD_MORE_ERROR_MESSAGE,
      }));
    }
  }, [conversationId, projectId, setConversationState, statesByConversation]);

  const sendMessage = useCallback(
    async (
      prompt: string,
      options?: { localId?: string; retry?: boolean }
    ): Promise<boolean> => {
      if (!conversationId) {
        return false;
      }

      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        return false;
      }

      const localId = options?.localId ?? createLocalId();
      const createdAt = new Date().toISOString();

      setConversationState(conversationId, (previousState) => {
        const nextMessages: AiAssistantUiMessage[] = options?.localId
          ? previousState.messages.map((message) =>
              message.localId === localId
                ? {
                    ...message,
                    status: options.retry
                      ? ("retrying" as const)
                      : ("sending" as const),
                    errorKind: undefined,
                  }
                : message
            )
          : [
              ...previousState.messages,
              {
                localId,
                prompt: trimmedPrompt,
                createdAt,
                status: "sending",
              },
            ];

        return {
          ...previousState,
          error: null,
          messages: nextMessages,
        };
      });

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => {
        controller.abort(new DOMException("Request timed out", "TimeoutError"));
      }, env.NEXT_PUBLIC_API_TIMEOUT_MS);

      pendingRequestsRef.current.set(localId, { controller, timeoutId });

      try {
        const response = await ConversationsService.askAiAssistant({
          conversationId,
          projectId: String(projectId),
          prompt: trimmedPrompt,
          signal: controller.signal,
          timeoutMs: 0,
        });

        clearPendingRequest(localId);

        const payload = response.data as { data?: AiAssistantMessage };
        if (!payload.data) {
          throw new Error("AI assistant response payload is empty.");
        }

        setConversationState(conversationId, (previousState) => ({
          ...previousState,
          messages: replaceLocalWithServerMessage(
            previousState.messages,
            localId,
            payload.data as AiAssistantMessage
          ),
        }));

        return true;
      } catch (error) {
        clearPendingRequest(localId);

        const errorKind = classifySendError(error, controller.signal);
        console.error("Failed to send AI assistant message:", error);

        if (errorKind === "limit") {
          showErrorModal({
            type: "error",
            headline: "현재 요금제의 사용량 한도에 도달했습니다.",
            hideCancel: true,
          });
        }

        setConversationState(conversationId, (previousState) => ({
          ...previousState,
          messages: previousState.messages.map((message) =>
            message.localId === localId
              ? {
                  ...message,
                  status:
                    errorKind === "canceled" ? "canceled" : "failed",
                  errorKind,
                }
              : message
          ),
        }));

        return false;
      }
    },
    [clearPendingRequest, conversationId, projectId, setConversationState]
  );

  const retryMessage = useCallback(
    async (localId: string): Promise<boolean> => {
      if (!conversationId) {
        return false;
      }

      const message = (
        statesByConversation[conversationId] ?? createDefaultConversationState()
      ).messages.find((item) => item.localId === localId);

      if (!message) {
        return false;
      }

      return sendMessage(message.prompt, { localId, retry: true });
    },
    [conversationId, sendMessage, statesByConversation]
  );

  const sending = useMemo(
    () =>
      currentState.messages.some(
        (message) =>
          message.status === "sending" || message.status === "retrying"
      ),
    [currentState.messages]
  );

  return {
    messages: currentState.messages,
    loading: currentState.loading,
    loadingMore: currentState.loadingMore,
    sending,
    error: currentState.error,
    hasMore: currentState.hasMore,
    loadMore,
    sendMessage,
    retryMessage,
  };
}
