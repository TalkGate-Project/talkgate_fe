import type { SmsStatus, SmsMessageType } from "@/types/sms";

export const PAGE_SIZE = 10;

export const MESSAGE_TYPE_OPTIONS = ["전체", "LMS", "SMS", "MMS"] as const;

export const STATUS_OPTIONS = ["전체", "완료", "처리중", "실패"] as const;

export const STATUS_VALUE_MAP: Record<string, SmsStatus | ""> = {
  전체: "",
  완료: "success",
  처리중: "processing",
  실패: "failed",
};

export const MESSAGE_TYPE_VALUE_MAP: Record<string, SmsMessageType | ""> = {
  전체: "",
  LMS: "LMS",
  SMS: "SMS",
  MMS: "MMS",
};

