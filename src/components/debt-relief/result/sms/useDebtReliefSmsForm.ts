import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { MessageType, ContentType, SendMethod, ImageFileWithPreview, SenderNumberOption } from "@/components/customers/sms";
import { MAX_IMAGES, SMS_BYTE_LIMIT, getByteLength } from "@/components/customers/sms";
import { SmsService } from "@/services/sms";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/lib/errorModalEvents";

// customers/sms의 useSmsForm을 단일 수신자(진단 고객 1명) 발송에 맞게 단순화한 버전.
// 대량 발송용 assignmentType(ids/filter) 분기가 필요 없고, 발송 API가 아직 없어 DebtReliefService의 mock으로 위임한다.
export function useDebtReliefSmsForm() {
  const [selectedSenderKey, setSelectedSenderKey] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>("informational");
  const [businessName, setBusinessName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFiles, setImageFiles] = useState<ImageFileWithPreview[]>([]);
  const [sendMethod, setSendMethod] = useState<SendMethod>("immediate");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  const [senderNumbers, setSenderNumbers] = useState<SenderNumberOption[]>([]);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<ImageFileWithPreview[]>([]);

  useEffect(() => {
    imageFilesRef.current = imageFiles;
  }, [imageFiles]);

  useEffect(() => {
    return () => {
      imageFilesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const loadSenderNumbers = useCallback(async () => {
    setLoadingSenders(true);
    try {
      const [memberRes, projectRes] = await Promise.all([
        SmsService.getMemberSenderNumbers({ page: 1, limit: 100 }),
        SmsService.getProjectSenderNumbers({ page: 1, limit: 100 }),
      ]);

      const options: SenderNumberOption[] = [];

      const memberData = (memberRes.data as any)?.data ?? memberRes.data;
      if (memberData?.numbers) {
        memberData.numbers.forEach((num: any) => {
          options.push({ id: num.id, phoneNumber: num.phoneNumber, source: "member" });
        });
      }

      const projectData = (projectRes.data as any)?.data ?? projectRes.data;
      if (projectData?.numbers) {
        projectData.numbers
          .filter((num: any) => num.status === "verified")
          .forEach((num: any) => {
            options.push({ id: num.id, phoneNumber: num.number, source: "project", status: num.status });
          });
      }

      setSenderNumbers(options);
      if (options.length > 0) {
        setSelectedSenderKey(`${options[0].source}-${options[0].id}`);
      }
    } catch (error) {
      console.error("발신번호 목록 로드 실패:", error);
    } finally {
      setLoadingSenders(false);
    }
  }, []);

  const handleSenderChange = useCallback((key: string) => {
    setSelectedSenderKey(key);
  }, []);

  const selectedSender = useMemo(() => {
    if (!selectedSenderKey) return null;
    const [source, idStr] = selectedSenderKey.split("-");
    const id = Number(idStr);
    return senderNumbers.find((s) => s.source === source && s.id === id) ?? null;
  }, [senderNumbers, selectedSenderKey]);

  // 배지에 표시되는 메시지 유형은 본문(사용자가 편집하는 영역)의 바이트 수 기준으로 판단한다.
  const messageType: MessageType = useMemo(() => {
    if (imageFiles.length > 0) return "MMS";
    return getByteLength(body) > SMS_BYTE_LIMIT ? "LMS" : "SMS";
  }, [body, imageFiles]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newFiles: ImageFileWithPreview[] = [];
      const remainingSlots = MAX_IMAGES - imageFiles.length;

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        const extension = file.name.toLowerCase().split(".").pop();
        if (extension !== "jpg" && extension !== "jpeg") {
          showErrorModal({
            title: "알림",
            headline: "jpg 파일만 첨부할 수 있습니다.",
            confirmText: "확인",
            cancelText: null,
            hideCancel: true,
          });
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        newFiles.push({ file, previewUrl, id: `${Date.now()}-${i}` });
      }

      if (newFiles.length > 0) {
        setImageFiles((prev) => [...prev, ...newFiles]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [imageFiles.length]
  );

  const handleRemoveFile = useCallback((id: string) => {
    setImageFiles((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // 모달을 열 때 템플릿에서 넘어온 본문으로 초기화한다.
  const handleReset = useCallback((seedBody: string = "") => {
    setContentType("informational");
    setTitle("");
    setBody(seedBody);
    imageFilesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImageFiles([]);
    setSendMethod("immediate");
    setScheduledDate(null);
    setScheduledTime(null);
  }, []);

  const handleSend = useCallback(
    async (params: {
      projectId: string;
      diagnosisId: string;
      recipientName: string;
      recipientPhone: string;
      content: string;
      imageUrls?: string[];
    }): Promise<{ success: boolean; message?: string }> => {
      if (!selectedSender) {
        return { success: false, message: "발신번호를 선택해주세요." };
      }
      if (!params.content.trim()) {
        return { success: false, message: "본문을 입력해주세요." };
      }
      if (sendMethod === "scheduled" && (!scheduledDate || !scheduledTime)) {
        return { success: false, message: "예약 발송 시간을 선택해주세요." };
      }

      setSending(true);
      try {
        let scheduledAt: string;
        if (sendMethod === "scheduled" && scheduledDate && scheduledTime) {
          const [hours, minutes] = scheduledTime.split(":").map(Number);
          const scheduled = new Date(scheduledDate);
          scheduled.setHours(hours, minutes, 0, 0);
          scheduledAt = scheduled.toISOString();
        } else {
          scheduledAt = new Date().toISOString();
        }

        await DebtReliefService.sendGuidanceSms(params.projectId, {
          diagnosisId: params.diagnosisId,
          recipientName: params.recipientName,
          recipientPhone: params.recipientPhone,
          senderNumberType: selectedSender.source,
          senderNumberId: selectedSender.id,
          advertisementType: contentType,
          serviceName: contentType === "advertising" ? businessName : undefined,
          title: title.trim() || undefined,
          content: params.content,
          scheduledAt,
          imageUrls: params.imageUrls && params.imageUrls.length > 0 ? params.imageUrls : undefined,
        });

        return { success: true, message: "문자 발송이 요청되었습니다." };
      } catch (error) {
        console.error("문자 발송 실패:", error);
        return { success: false, message: "문자 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
      } finally {
        setSending(false);
      }
    },
    [selectedSender, contentType, businessName, title, sendMethod, scheduledDate, scheduledTime]
  );

  return {
    selectedSenderKey,
    selectedSender,
    senderNumbers,
    loadingSenders,
    contentType,
    businessName,
    title,
    body,
    imageFiles,
    sendMethod,
    messageType,
    scheduledDate,
    scheduledTime,
    sending,
    handleSenderChange,
    setContentType,
    setBusinessName,
    setTitle,
    setBody,
    setSendMethod,
    setScheduledDate,
    setScheduledTime,
    loadSenderNumbers,
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    handleRemoveFile,
    handleSend,
    handleReset,
  };
}
