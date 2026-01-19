import { useCallback, useRef, useState } from "react";

function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  const raw = String(((document.body.style as any).zoom ?? "") as string).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * 이모지 피커 관련 로직을 관리하는 훅
 */
export function useEmojiPicker() {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerMode, setEmojiPickerMode] = useState<"compact" | "full">("compact");
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ x: 0, y: 0 });
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const mobileEmojiButtonRef = useRef<HTMLButtonElement>(null);

  const handleEmojiButtonClick = useCallback(() => {
    // 토글: 열려 있으면 닫기, 닫혀 있으면 compact로 열기
    if (emojiPickerOpen) {
      setEmojiPickerOpen(false);
      return;
    }
    
    // 모바일/데스크탑 버튼 중 활성화된 버튼 찾기
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const activeButton = isMobile && mobileEmojiButtonRef.current 
      ? mobileEmojiButtonRef.current 
      : emojiButtonRef.current;
    
    if (activeButton) {
      const rect = activeButton.getBoundingClientRect();
      // body zoom(컴팩트 0.8 / 기본 1) 기준으로 위치 보정
      const zoom = getBodyZoom();
      // 모바일에서는 입력 필드 내부 오른쪽에 있으므로 위치 조정
      if (isMobile && mobileEmojiButtonRef.current) {
        // 모바일: 이모지 피커를 버튼 위쪽에 표시, x축을 왼쪽으로 더 많이 이동하여 화면 밖으로 나가지 않도록 조정
        const pickerWidth = 216; // full mode width
        const screenWidth = window.innerWidth;
        // 피커가 화면 밖으로 나가지 않도록 계산
        // 버튼 오른쪽 끝에서 피커 너비만큼 왼쪽으로 이동, 최소 16px 여백 유지
        const desiredX = rect.right - pickerWidth - 16;
        // 화면 왼쪽 경계를 넘지 않도록 보정
        const finalX = Math.max(16, desiredX);
        setEmojiPickerPosition({
          x: finalX / zoom,
          y: rect.top / zoom,
        });
      } else if (emojiButtonRef.current) {
        // 데스크탑: 기존 위치 계산
        const desktopRect = emojiButtonRef.current.getBoundingClientRect();
        setEmojiPickerPosition({
          x: (desktopRect.left - 150) / zoom,
          y: desktopRect.top / zoom,
        });
      }
    }
    setEmojiPickerMode("compact");
    setEmojiPickerOpen(true);
  }, [emojiPickerOpen]);

  const handleClose = useCallback(() => {
    setEmojiPickerOpen(false);
  }, []);

  return {
    emojiPickerOpen,
    emojiPickerMode,
    emojiPickerPosition,
    emojiButtonRef,
    mobileEmojiButtonRef,
    handleEmojiButtonClick,
    handleClose,
    setEmojiPickerMode,
  };
}
