import { useCallback, useRef } from "react";

/**
 * 파일 첨부 관련 로직을 관리하는 훅
 */
export function useChatAttachment(sendAttachment: (file: File) => void) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onAttachImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const onAttachFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImageSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) sendAttachment(file);
      e.target.value = ""; // 같은 파일 재선택 허용
    },
    [sendAttachment]
  );

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) sendAttachment(file);
      e.target.value = "";
    },
    [sendAttachment]
  );

  return {
    imageInputRef,
    fileInputRef,
    onAttachImage,
    onAttachFile,
    onImageSelected,
    onFileSelected,
  };
}
