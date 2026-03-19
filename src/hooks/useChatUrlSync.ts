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
  const previousQueryConvIdRef = useRef<number | null>(
    Number.isFinite(paramConversationId) ? paramConversationId : null
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

    const previousQueryConvId = previousQueryConvIdRef.current;
    previousQueryConvIdRef.current = isValidConvId ? convIdNumber : null;

    // 쿼리스트링에 conversationId가 없는데 activeId가 있으면 초기화
    // (뒤로가기/명시적 닫기로 실제 URL에서 conversationId가 제거된 경우)
    if (!currentConvId && activeId && previousQueryConvId !== null) {
      setActiveId(null);
      // 모달 상태도 초기화
      onModalStateReset?.();
      return;
    }

    if (!isValidConvId || activeId !== null || activeId === convIdNumber) {
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
  }, [
    filteredConversations,
    activeId,
    hasInitializedConversations,
    isConversationsLoading,
    setActiveId,
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
