import type { SmsStatus } from "@/types/sms";
import { SMS_STATUS_LABEL } from "@/types/sms";

interface StatusBadgeProps {
  status: SmsStatus;
}

const STATUS_CONFIG: Record<SmsStatus, { bgColor: string; textColor: string }> = {
  pending: {
    bgColor: "bg-[#F3F4F6] dark:bg-neutral-20",
    textColor: "text-[#4B5563] dark:text-neutral-60",
  },
  processing: {
    bgColor: "bg-[#FEF9C3] dark:bg-[#FEF9C3]",
    textColor: "text-[#854D0E] dark:text-[#854D0E]",
  },
  success: {
    bgColor: "bg-[#DCFCE7] dark:bg-[#DCFCE7]",
    textColor: "text-[#166534] dark:text-[#166534]",
  },
  failed: {
    bgColor: "bg-[#FEE2E2] dark:bg-[#FEE2E2]",
    textColor: "text-[#991B1B] dark:text-[#991B1B]",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = SMS_STATUS_LABEL[status] || status;
  const { bgColor, textColor } = STATUS_CONFIG[status] || STATUS_CONFIG.processing;

  return (
    <span
      className={`inline-flex items-center h-[24px] px-2.5 rounded-[4px] text-[12px] font-medium ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
}

