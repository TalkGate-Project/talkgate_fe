import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Conversation } from "@/lib/realtime";

/**
 * URL 쿼리 파라미터와 채팅 상태를 동기화하는 훅
 */
export function useChatUrlSync(
  activeId: number | null,
  setActiveId: (id: number | null) => void,
  filteredConversations: Conversation[],
  onModalStateReset?: () => void
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
    
    // 쿼리스트링에 conversationId가 없는데 activeId가 있으면 초기화
    // (뒤로가기로 상담 목록으로 돌아온 경우)
    if (!currentConvId && activeId) {
      setActiveId(null);
      // 모달 상태도 초기화
      onModalStateReset?.();
      return;
    }
    
    // 쿼리스트링에 conversationId가 있는데 activeId와 다르면 동기화
    // (URL 직접 입력 또는 딥링크로 접근한 경우)
    if (isValidConvId && activeId !== convIdNumber) {
      // filteredConversations에 해당 conversationId가 있는지 확인
      const exists = filteredConversations.some((c) => c.id === convIdNumber);
      if (exists) {
        setActiveId(convIdNumber);
      } else {
        // 존재하지 않으면 activeId를 null로 설정 (필터 변경 등으로 목록에서 사라진 경우)
        setActiveId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 현재 필터에서 activeId가 유효한지 확인
  useEffect(() => {
    if (!filteredConversations.length) {
      setActiveId(null);
      return;
    }
    // 데이터가 도착했을 때 딥링크된 conversationId / customerId를 한 번만 반영
    if (!activeId) {
      const wanted = desiredConvIdRef.current;
      if (wanted && filteredConversations.some((c) => c.id === wanted)) {
        setActiveId(wanted);
        desiredConvIdRef.current = null;
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
      }
    }
    const stillVisible = filteredConversations.some((c) => c.id === activeId);
    if (!stillVisible) {
      // 선택된 항목이 없으면 유휴 상태 유지; 자동 선택하지 않음
      setActiveId(null);
    }
  }, [filteredConversations, activeId, setActiveId]);

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
    } else if (params.has("conversationId")) {
      // conversationId 제거: push (상담 목록으로 돌아가기, 히스토리 추가)
      params.delete("conversationId");
      router.push(`?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // 모바일에서 채팅방 닫기
  const handleCloseConversationMobile = useCallback(() => {
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
