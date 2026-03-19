import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Conversation } from "@/lib/realtime";

type UseChatUrlSyncOptions = {
  isConversationsLoading: boolean;
  hasInitializedConversations: boolean;
  onModalStateReset?: () => void;
};

/**
 * URL 쿼리 파라미터와 채팅 상태를 동기화하는 훅
 */
export function useChatUrlSync(
  activeId: number | null,
  setActiveId: (id: number | null) => void,
  filteredConversations: Conversation[],
  {
    isConversationsLoading,
    hasInitializedConversations,
    onModalStateReset,
  }: UseChatUrlSyncOptions
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 쿼리 파라미터를 통한 딥링크 지원
  const paramConversationId = Number(searchParams.get("conversationId") || "");
  const paramCustomerId = Number(searchParams.get("customerId") || "");
  const desiredConvIdRef = useRef<number | null>(
    Number.isFinite(paramConversationId) ? paramConversationId : null
  );
  const desiredCustomerIdRef = useRef<number | null>(
    Number.isFinite(paramCustomerId) ? paramCustomerId : null
  );

  // 쿼리스트링 변경 감지: conversationId가 제거되면 activeId와 모달 상태 초기화
  // (브라우저 뒤로가기 등으로 쿼리스트링이 변경된 경우 처리)
  useEffect(() => {
    const currentConvId = searchParams.get("conversationId");
    const convIdNumber = currentConvId ? Number(currentConvId) : null;
    const isValidConvId = convIdNumber !== null && Number.isFinite(convIdNumber);
    const currentCustomerId = searchParams.get("customerId");
    const customerIdNumber = currentCustomerId ? Number(currentCustomerId) : null;
    const isValidCustomerId =
      customerIdNumber !== null && Number.isFinite(customerIdNumber);

    desiredConvIdRef.current = isValidConvId ? convIdNumber : null;
    desiredCustomerIdRef.current = isValidCustomerId ? customerIdNumber : null;

    // 쿼리스트링에 conversationId가 없는데 activeId가 있으면 초기화
    // (뒤로가기로 상담 목록으로 돌아온 경우)
    if (!currentConvId && activeId) {
      setActiveId(null);
      // 모달 상태도 초기화
      onModalStateReset?.();
      return;
    }

    if (!isValidConvId || activeId === convIdNumber) {
      if (activeId === convIdNumber) {
        desiredConvIdRef.current = null;
      }
      return;
    }

    // 쿼리스트링에 conversationId가 있는데 activeId와 다르면 동기화
    // (URL 직접 입력 또는 딥링크로 접근한 경우)
    if (filteredConversations.some((c) => c.id === convIdNumber)) {
      desiredConvIdRef.current = null;
      setActiveId(convIdNumber);
    }
  }, [
    searchParams,
    activeId,
    filteredConversations,
    onModalStateReset,
    setActiveId,
  ]);

  // 현재 필터에서 activeId가 유효한지 확인
  useEffect(() => {
    // 데이터가 도착했을 때 딥링크된 conversationId / customerId를 한 번만 반영
    if (!activeId) {
      const wanted = desiredConvIdRef.current;
      if (wanted && filteredConversations.some((c) => c.id === wanted)) {
        setActiveId(wanted);
        desiredConvIdRef.current = null;
        return;
      }

      if (wanted && hasInitializedConversations && !isConversationsLoading) {
        desiredConvIdRef.current = null;
        setActiveId(wanted);
        return;
      }

      const wantedCustomer = desiredCustomerIdRef.current;
      if (wantedCustomer != null) {
        const hit = (filteredConversations as any[]).find(
          (c) => c.customerId === wantedCustomer
        );
        if (hit) {
          setActiveId((hit as any).id);
          desiredCustomerIdRef.current = null;
          return;
        }

        if (hasInitializedConversations && !isConversationsLoading) {
          desiredCustomerIdRef.current = null;
        }
      }

      return;
    }

    const stillVisible = filteredConversations.some((c) => c.id === activeId);
    if (stillVisible) {
      if (desiredConvIdRef.current === activeId) {
        desiredConvIdRef.current = null;
      }
      return;
    }

    const currentConvId = Number(searchParams.get("conversationId") || "");
    const isDeepLinkedActive =
      Number.isFinite(currentConvId) && currentConvId === activeId;
    if (isDeepLinkedActive || !hasInitializedConversations || isConversationsLoading) {
      return;
    }

    if (!stillVisible) {
      // 선택된 항목이 없으면 유휴 상태 유지; 자동 선택하지 않음
      setActiveId(null);
    }
  }, [
    filteredConversations,
    activeId,
    hasInitializedConversations,
    isConversationsLoading,
    searchParams,
    setActiveId,
  ]);

  // 선택과 conversationId 파라미터 동기화 유지
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentConvId = params.get("conversationId");

    if (activeId) {
      // conversationId가 없을 때 추가하는 경우: push (히스토리 추가)
      // conversationId가 있을 때 변경하는 경우: replace (같은 페이지 내 전환)
      params.set("conversationId", String(activeId));
      if (currentConvId && currentConvId !== String(activeId)) {
        // 다른 대화로 전환: replace
        router.replace(`?${params.toString()}`, { scroll: false });
      } else if (!currentConvId) {
        // 대화 선택: push (히스토리 추가)
        router.push(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [
    activeId,
    router,
    searchParams,
  ]);

  // 모바일에서 채팅방 닫기
  const handleCloseConversationMobile = useCallback(() => {
    desiredConvIdRef.current = null;
    desiredCustomerIdRef.current = null;
    setActiveId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("conversationId");
    // push를 사용하여 히스토리에 추가 (뒤로가기 시 상담 목록으로 이동)
    router.push(`?${params.toString()}`, { scroll: false });
  }, [setActiveId, searchParams, router]);

  return {
    handleCloseConversationMobile,
  };
}
