import type { SmsMessageType } from "@/types/sms";

interface MessageTypeBadgeProps {
  type: SmsMessageType;
}

const MESSAGE_TYPE_CONFIG: Record<SmsMessageType, { bgColor: string; textColor: string }> = {
  SMS: {
    bgColor: "bg-[#E0F2FE] dark:bg-[#E0F2FE]",
    textColor: "text-[#0369A1] dark:text-[#0369A1]",
  },
  LMS: {
    bgColor: "bg-[#F3E8FF] dark:bg-[#F3E8FF]",
    textColor: "text-[#7C3AED] dark:text-[#7C3AED]",
  },
  MMS: {
    bgColor: "bg-[#FCE7F3] dark:bg-[#FCE7F3]",
    textColor: "text-[#BE185D] dark:text-[#BE185D]",
  },
};

export default function MessageTypeBadge({ type }: MessageTypeBadgeProps) {
  const { bgColor, textColor } = MESSAGE_TYPE_CONFIG[type] || MESSAGE_TYPE_CONFIG.SMS;

  return (
    <span
      className={`inline-flex items-center h-[24px] px-2.5 rounded-[4px] text-[12px] font-medium ${bgColor} ${textColor}`}
    >
      {type}
    </span>
  );
}

