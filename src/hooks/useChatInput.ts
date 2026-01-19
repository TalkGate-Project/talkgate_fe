import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * 채팅방별 입력 내용을 관리하는 훅
 * 채팅방 전환 시 입력 내용을 저장하고 복원합니다.
 */
export function useChatInput(activeId: number | null) {
  // 채팅방별 입력 내용 저장
  const inputByConversationRef = useRef<Map<number, string>>(new Map());
  // 현재 활성 채팅방의 입력 내용
  const [input, setInputState] = useState("");
  // 이전 activeId 추적 (채팅방 전환 감지용)
  const prevActiveIdRef = useRef<number | null>(null);
  // 작성 중인 메시지가 있는 채팅방 ID Set을 state로 관리 (리렌더링 트리거용)
  const [conversationsWithDraft, setConversationsWithDraft] = useState<Set<number>>(new Set());

  // 채팅방 전환 시 입력 내용 저장/복원
  useEffect(() => {
    const prevActiveId = prevActiveIdRef.current;
    
    // 채팅방이 변경되었을 때만 처리
    if (prevActiveId !== activeId) {
      // 이전 채팅방의 입력 내용 저장 (현재 input 값)
      if (prevActiveId !== null) {
        // 현재 input 값을 가져와서 저장
        setInput((currentInput) => {
          // 보내지 않은 메시지가 있으면 저장
          if (currentInput.trim()) {
            inputByConversationRef.current.set(prevActiveId, currentInput);
            setConversationsWithDraft((prev) => new Set(prev).add(prevActiveId));
          } else {
            // 빈 문자열이면 제거
            inputByConversationRef.current.delete(prevActiveId);
            setConversationsWithDraft((prev) => {
              const next = new Set(prev);
              next.delete(prevActiveId);
              return next;
            });
          }
          return currentInput;
        });
      }
      
      // 새로운 채팅방으로 전환 시 저장된 입력 내용 복원
      if (activeId !== null) {
        // 저장된 입력 내용이 있으면 복원, 없으면 빈 문자열
        const savedInput = inputByConversationRef.current.get(activeId) || "";
        setInputState(savedInput);
      } else {
        // 채팅방을 나갔을 때 입력 내용 초기화
        setInputState("");
      }
      
      // 이전 activeId 업데이트
      prevActiveIdRef.current = activeId;
    }
  }, [activeId]);

  // 입력 내용 변경 시 저장 및 conversationsWithDraft 업데이트
  useEffect(() => {
    if (activeId === null) {
      // activeId가 null이면 conversationsWithDraft에서 제거
      setConversationsWithDraft((prev) => {
        const next = new Set(prev);
        inputByConversationRef.current.forEach((_, id) => {
          if (!inputByConversationRef.current.get(id)?.trim()) {
            next.delete(id);
          } else {
            next.add(id);
          }
        });
        return next;
      });
      return;
    }
    
    // 현재 활성 채팅방의 입력 내용 저장
    if (input.trim()) {
      inputByConversationRef.current.set(activeId, input);
      setConversationsWithDraft((prev) => new Set(prev).add(activeId));
    } else {
      inputByConversationRef.current.delete(activeId);
      setConversationsWithDraft((prev) => {
        const next = new Set(prev);
        next.delete(activeId);
        return next;
      });
    }
  }, [input, activeId]);

  // 입력 내용 변경 핸들러 (함수 업데이트 지원)
  const setInput: Dispatch<SetStateAction<string>> = useCallback((value) => {
    setInputState(value);
  }, []);

  // 메시지 전송 후 입력 내용 초기화
  const clearInput = useCallback(() => {
    setInputState("");
    // 현재 채팅방의 작성 중인 메시지 제거
    if (activeId) {
      inputByConversationRef.current.delete(activeId);
      setConversationsWithDraft((prev) => {
        const next = new Set(prev);
        next.delete(activeId);
        return next;
      });
    }
  }, [activeId]);

  return {
    input,
    setInput,
    clearInput,
    conversationsWithDraft,
  };
}
