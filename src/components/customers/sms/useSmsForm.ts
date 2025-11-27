import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type {
  MessageType,
  ContentType,
  SendMethod,
  ImageFileWithPreview,
} from "./types";
import { MAX_IMAGES, SMS_BYTE_LIMIT, getByteLength } from "./types";

export function useSmsForm() {
  // 폼 상태
  const [senderNumber, setSenderNumber] = useState("010-1234-5678");
  const [contentType, setContentType] = useState<ContentType>("informational");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFiles, setImageFiles] = useState<ImageFileWithPreview[]>([]);
  const [sendMethod, setSendMethod] = useState<SendMethod>("scheduled");
  
  // 예약발송 날짜/시간
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<ImageFileWithPreview[]>([]);

  // imageFiles 변경 시 ref도 동기화 (언마운트 시 정리용)
  useEffect(() => {
    imageFilesRef.current = imageFiles;
  }, [imageFiles]);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      imageFilesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []);

  // 메시지 타입 자동 결정
  const messageType: MessageType = useMemo(() => {
    if (imageFiles.length > 0) return "MMS";
    const bodyBytes = getByteLength(body);
    return bodyBytes > SMS_BYTE_LIMIT ? "LMS" : "SMS";
  }, [body, imageFiles]);

  // 파일 선택 트리거
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 파일 변경 핸들러
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newFiles: ImageFileWithPreview[] = [];
      const remainingSlots = MAX_IMAGES - imageFiles.length;

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];

        // jpg 확장자만 허용
        const extension = file.name.toLowerCase().split(".").pop();
        if (extension !== "jpg" && extension !== "jpeg") {
          alert("jpg 파일만 첨부할 수 있습니다.");
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        newFiles.push({
          file,
          previewUrl,
          id: `${Date.now()}-${i}`,
        });
      }

      if (newFiles.length > 0) {
        setImageFiles((prev) => [...prev, ...newFiles]);
      }

      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [imageFiles.length]
  );

  // 파일 삭제 핸들러
  const handleRemoveFile = useCallback((id: string) => {
    setImageFiles((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // 폼 초기화
  const handleReset = useCallback(() => {
    setSenderNumber("010-1234-5678");
    setContentType("informational");
    setTitle("");
    setBody("");
    // 이미지 미리보기 URL 정리
    imageFiles.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setImageFiles([]);
    setSendMethod("scheduled");
    setScheduledDate(null);
    setScheduledTime(null);
  }, [imageFiles]);

  return {
    // 상태
    senderNumber,
    contentType,
    title,
    body,
    imageFiles,
    sendMethod,
    messageType,
    scheduledDate,
    scheduledTime,

    // 세터
    setSenderNumber,
    setContentType,
    setTitle,
    setBody,
    setSendMethod,
    setScheduledDate,
    setScheduledTime,

    // 파일 관련
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    handleRemoveFile,

    // 기타
    handleReset,
  };
}

