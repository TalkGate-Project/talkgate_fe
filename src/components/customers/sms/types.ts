import type { CustomerListItem } from "@/types/customers";
import type { MemberSenderNumber, ProjectSenderNumber } from "@/types/sms";

export type MessageType = "SMS" | "LMS" | "MMS";
export type ContentType = "advertising" | "informational";
export type SendMethod = "immediate" | "scheduled";
export type SenderNumberSource = "project" | "member";

export type ImageFileWithPreview = {
  file: File;
  previewUrl: string;
  id: string;
};

export type SmsModalProps = {
  open: boolean;
  onClose: () => void;
  customers: CustomerListItem[];
  onSuccess?: () => void;
};

export type SmsFormState = {
  senderNumber: string;
  contentType: ContentType;
  title: string;
  body: string;
  imageFiles: ImageFileWithPreview[];
  sendMethod: SendMethod;
};

// 통합 발신번호 타입 (UI에서 사용)
export type SenderNumberOption = {
  id: number;
  phoneNumber: string;
  source: SenderNumberSource;
  status?: string; // project sender number에만 있음
};

export const MAX_IMAGES = 3;
export const SMS_BYTE_LIMIT = 90;

// Re-export for convenience
export type { MemberSenderNumber, ProjectSenderNumber };

// SMS 바이트 계산 (한글 2바이트, 영문/숫자 1바이트)
export function getByteLength(text: string): number {
  let byteLength = 0;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // 한글 범위 (가-힣) 또는 한글 자모
    if (
      (charCode >= 0xac00 && charCode <= 0xd7af) ||
      (charCode >= 0x1100 && charCode <= 0x11ff) ||
      (charCode >= 0x3130 && charCode <= 0x318f)
    ) {
      byteLength += 2;
    } else {
      byteLength += 1;
    }
  }
  return byteLength;
}

