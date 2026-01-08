import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type {
  MessageType,
  ContentType,
  SendMethod,
  ImageFileWithPreview,
  SenderNumberOption,
} from "./types";
import { MAX_IMAGES, SMS_BYTE_LIMIT, getByteLength } from "./types";
import { SmsService } from "@/services/sms";
import type { CustomerListItem } from "@/types/customers";
import { showErrorModal } from "@/lib/errorModalEvents";

export function useSmsForm() {
  // 폼 상태 - 발신번호는 "source-id" 형식의 복합 키로 관리
  const [selectedSenderKey, setSelectedSenderKey] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>("informational");
  const [businessName, setBusinessName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFiles, setImageFiles] = useState<ImageFileWithPreview[]>([]);
  const [sendMethod, setSendMethod] = useState<SendMethod>("immediate");
  
  // 예약발송 날짜/시간
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  // 발신번호 목록
  const [senderNumbers, setSenderNumbers] = useState<SenderNumberOption[]>([]);
  const [loadingSenders, setLoadingSenders] = useState(false);

  // 발송 상태
  const [sending, setSending] = useState(false);

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

  // 발신번호 목록 로드
  const loadSenderNumbers = useCallback(async () => {
    setLoadingSenders(true);
    try {
      const [memberRes, projectRes] = await Promise.all([
        SmsService.getMemberSenderNumbers({ page: 1, limit: 100 }),
        SmsService.getProjectSenderNumbers({ page: 1, limit: 100 }),
      ]);

      const options: SenderNumberOption[] = [];

      // 멤버 발신번호 추가
      const memberData = (memberRes.data as any)?.data ?? memberRes.data;
      if (memberData?.numbers) {
        memberData.numbers.forEach((num: any) => {
          options.push({
            id: num.id,
            phoneNumber: num.phoneNumber,
            source: "member",
          });
        });
      }

      // 프로젝트 발신번호 추가 (승인된 것만)
      const projectData = (projectRes.data as any)?.data ?? projectRes.data;
      if (projectData?.numbers) {
        projectData.numbers
          .filter((num: any) => num.status === "verified")
          .forEach((num: any) => {
            options.push({
              id: num.id,
              phoneNumber: num.number,
              source: "project",
              status: num.status,
            });
          });
      }

      setSenderNumbers(options);

      // 첫 번째 번호를 기본 선택 (source-id 형식)
      if (options.length > 0) {
        setSelectedSenderKey(`${options[0].source}-${options[0].id}`);
      }
    } catch (error) {
      console.error("발신번호 목록 로드 실패:", error);
    } finally {
      setLoadingSenders(false);
    }
  }, []);

  // 선택된 발신번호 변경 (source-id 형식의 키 사용)
  const handleSenderChange = useCallback((key: string) => {
    setSelectedSenderKey(key);
  }, []);

  // 선택된 발신번호 객체 (source-id 형식으로 파싱)
  const selectedSender = useMemo(() => {
    if (!selectedSenderKey) return null;
    const [source, idStr] = selectedSenderKey.split("-");
    const id = Number(idStr);
    return senderNumbers.find((s) => s.source === source && s.id === id) ?? null;
  }, [senderNumbers, selectedSenderKey]);

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

  // 폼 초기화 (ref를 사용하여 의존성 제거)
  const handleReset = useCallback(() => {
    setContentType("informational");
    setBusinessName("");
    setTitle("");
    setBody("");
    // 이미지 미리보기 URL 정리 (ref 사용으로 의존성 제거)
    imageFilesRef.current.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setImageFiles([]);
    setSendMethod("immediate");
    setScheduledDate(null);
    setScheduledTime(null);
  }, []);

  // SMS 발송
  const handleSend = useCallback(
    async (
      customers: CustomerListItem[],
      imageUrls?: string[],
      selectionMode?: "page" | "all" | null,
      appliedFilters?: any,
      totalCount?: number,
      projectId?: string
    ): Promise<{ success: boolean; message?: string }> => {
      if (!selectedSender) {
        return { success: false, message: "발신번호를 선택해주세요." };
      }

      if (!body.trim()) {
        return { success: false, message: "본문을 입력해주세요." };
      }

      if (customers.length === 0) {
        return { success: false, message: "수신자를 선택해주세요." };
      }

      // 예약발송인데 날짜/시간이 없는 경우
      if (sendMethod === "scheduled" && (!scheduledDate || !scheduledTime)) {
        return { success: false, message: "예약 발송 시간을 선택해주세요." };
      }

      setSending(true);

      try {
        // 서버에서 광고성 문구(수신거부 등)를 부가적으로 붙여 저장하므로,
        // 프론트에서 동일 문구를 포함해 보내지 않도록(중복 방지) 전송용 본문을 정리한다.
        const contentToSend =
          contentType === "advertising"
            ? (() => {
                // 사용자가 기존에 입력해둔 수신거부 라인이 있으면 제거
                const removedOptOut = body.replace(/\n?\s*수신거부\s*080-880-4005\s*$/u, "");
                // 서버가 수신거부 문구를 붙일 때 "1줄 공백" 다음에 나오도록
                // 전송 본문 끝을 정확히 "\n\n"로 맞춘다.
                const trimmedEnd = removedOptOut.replace(/\s+$/u, "");
                return `${trimmedEnd}\n\n`;
              })()
            : body;

        // scheduledAt 계산 (필수 필드 - 즉시 발송 시 현재 시간, 예약 발송 시 지정된 시간)
        let scheduledAt: string;
        if (sendMethod === "scheduled" && scheduledDate && scheduledTime) {
          const [hours, minutes] = scheduledTime.split(":").map(Number);
          const scheduled = new Date(scheduledDate);
          scheduled.setHours(hours, minutes, 0, 0);
          scheduledAt = scheduled.toISOString();
        } else {
          // 즉시 발송: 현재 시간
          scheduledAt = new Date().toISOString();
        }

        let response;
        if (selectionMode === "all" && appliedFilters && totalCount !== undefined && projectId) {
          // 전체 목록 선택: 필터 기준으로 발송
          response = await SmsService.send({
            assignmentType: "filter",
            filters: {
              name: appliedFilters.name,
              contact1: appliedFilters.contact1,
              contact2: appliedFilters.contact2,
              noteContent: appliedFilters.noteContent,
              assignType: appliedFilters.assignType,
              teamId: appliedFilters.teamId,
              memberId: appliedFilters.memberId,
              applicationRoute: appliedFilters.applicationRoute,
              mediaCompany: appliedFilters.mediaCompany,
              site: appliedFilters.site,
              // null을 빈 문자열로 변환하여 "일반" 카테고리를 나타냄
              categoryIds: appliedFilters.categoryIds?.map((id: number | null) => id === null ? "" : id),
              applicationDateFrom: appliedFilters.applicationDateFrom,
              applicationDateTo: appliedFilters.applicationDateTo,
              assignedAtFrom: appliedFilters.assignedAtFrom,
              assignedAtTo: appliedFilters.assignedAtTo,
            },
            expectedCount: totalCount,
            senderNumberType: selectedSender.source,
            senderNumberId: selectedSender.id,
            advertisementType: contentType,
            serviceName: contentType === "advertising" ? businessName : undefined,
            title: title.trim() || undefined,
            content: contentToSend,
            scheduledAt,
            imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
          });
        } else {
          // 현재 페이지 선택: ID 기준으로 발송
          response = await SmsService.send({
            assignmentType: "ids",
            customerIds: customers.map((c) => c.id),
            senderNumberType: selectedSender.source,
            senderNumberId: selectedSender.id,
            advertisementType: contentType,
            serviceName: contentType === "advertising" ? businessName : undefined,
            title: title.trim() || undefined,
            content: contentToSend,
            scheduledAt,
            imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
          });
        }

        const data = (response.data as any)?.data ?? response.data;
        
        if (response.data?.result || data?.smsHistoryId) {
          const totalRecipients = data?.smsHistory?.totalRecipients || data?.totalRecipients || customers.length;
          const validContactsCount = data?.validContactsCount;
          const optedOutCount = data?.optedOutCount || 0;
          
          let message = `${totalRecipients}명에게 문자 발송이 요청되었습니다.`;
          if (validContactsCount !== undefined && validContactsCount !== totalRecipients) {
            message = `${validContactsCount}명에게 문자 발송이 요청되었습니다.`;
            if (optedOutCount > 0) {
              message += ` (수신거부 ${optedOutCount}명 제외)`;
            }
          }
          
          return {
            success: true,
            message,
          };
        } else {
          return {
            success: false,
            message: "문자 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
          };
        }
      } catch (error: any) {
        console.error("SMS 발송 실패:", error);
        
        const errorCode = error?.data?.code || "";
        const errorMessage = error?.data?.message || error?.message || "";
        const status = error?.status;
        
        // 광고성 문자 시간 제한 에러 처리
        if (errorCode === "ADVERTISEMENT_SMS_TIME_RESTRICTED") {
          const message = sendMethod === "immediate"
            ? "현재 시간은 광고성 문자 발송 제한 시간입니다.\n야간 시간 발송 제한 (21:00 ~ 08:00)"
            : "해당 시간은 광고성 문자 발송 제한 시간입니다.\n야간 시간 발송 제한 (21:00 ~ 08:00)";
          return {
            success: false,
            message,
          };
        }
        
        // 에러 코드별 사용자 친화적 메시지 매핑
        const errorMessages: Record<string, string> = {
          // 400 에러
          MISSING_PROJECT_ID: "프로젝트 정보를 확인할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.",
          NOT_PROJECT_MEMBER: "프로젝트 멤버만 문자를 발송할 수 있습니다.",
          CUSTOMER_COUNT_MISMATCH: "고객 정보가 맞지 않습니다다. 페이지를 새로고침 후 다시 시도해주세요.",
          BAD_REQUEST: "요청 정보가 올바르지 않습니다. 입력 내용을 확인해주세요.",
          
          // 401 에러
          MISSING_AUTHENTICATION_TOKEN: "로그인이 필요합니다. 다시 로그인해주세요.",
          UNAUTHORIZED: "인증이 만료되었습니다. 다시 로그인해주세요.",
          INVALID_ACCESS_TOKEN: "인증 정보가 유효하지 않습니다. 다시 로그인해주세요.",
          
          // 404 에러
          PROJECT_NOT_FOUND: "프로젝트를 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.",
          CUSTOMER_NOT_FOUND: "선택한 고객 정보를 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.",
        };
        
        // 수신 거부 관련 에러 감지 (메시지나 코드에서 판단)
        const isOptedOutError =
          errorMessage.toLowerCase().includes("recipient") ||
          errorMessage.toLowerCase().includes("all") ||
          errorCode.toLowerCase().includes("opted_out") ||
          errorCode.toLowerCase().includes("rejected");
        
        if (isOptedOutError) {
          // 수신 거부된 사용자 수 추출 시도
          const recipientMatch = errorMessage.match(/(\d+)\s*recipient/i);
          const recipientCount = recipientMatch ? recipientMatch[1] : "";
          
          if (recipientCount) {
            return {
              success: false,
              message: `선택한 고객 ${recipientCount}명이 수신을 거부하여 문자를 발송할 수 없습니다.`,
            };
          } else {
            return {
              success: false,
              message: "선택한 고객이 수신을 거부하여 문자를 발송할 수 없습니다.",
            };
          }
        }
        
        // 에러 코드에 해당하는 메시지가 있으면 사용
        if (errorCode && errorMessages[errorCode]) {
          return {
            success: false,
            message: errorMessages[errorCode],
          };
        }
        
        // 상태 코드 기반 기본 메시지
        if (status === 400) {
          return {
            success: false,
            message: "요청 정보가 올바르지 않습니다. 입력 내용을 확인해주세요.",
          };
        }
        
        if (status === 401 || status === 403) {
          return {
            success: false,
            message: "인증이 필요합니다. 다시 로그인해주세요.",
          };
        }
        
        if (status === 404) {
          return {
            success: false,
            message: "요청한 정보를 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.",
          };
        }
        
        // 기타 에러는 일반적인 메시지 사용
        return {
          success: false,
          message: "문자 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        };
      } finally {
        setSending(false);
      }
    },
    [selectedSender, contentType, businessName, title, body, sendMethod, scheduledDate, scheduledTime]
  );

  return {
    // 상태
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

    // 세터
    handleSenderChange,
    setContentType,
    setBusinessName,
    setTitle,
    setBody,
    setSendMethod,
    setScheduledDate,
    setScheduledTime,

    // 발신번호 로드
    loadSenderNumbers,

    // 파일 관련
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    handleRemoveFile,

    // 발송
    handleSend,

    // 기타
    handleReset,
  };
}
