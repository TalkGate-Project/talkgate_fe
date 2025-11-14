interface MessengerBadgeProps {
  /** Messenger identifier from API (e.g. "kakaotalk") or Korean label (e.g. "카카오톡") */
  messenger: string;
  className?: string;
}

type MessengerCode = "kakaotalk" | "instagram" | "telegram" | "line" | "wechat" | "other";

const normalizeMessenger = (value: string): MessengerCode => {
  if (!value) return "other";

  const lower = value.toLowerCase();

  // API 코드 우선 매핑
  if (lower === "kakaotalk") return "kakaotalk";
  if (lower === "instagram") return "instagram";
  if (lower === "telegram") return "telegram";
  if (lower === "line") return "line";
  if (lower === "wechat") return "wechat";

  // 한글 라벨 매핑
  if (value === "카카오톡" || value === "카카오") return "kakaotalk";
  if (value === "인스타그램") return "instagram";
  if (value === "텔레그램") return "telegram";
  if (value === "라인") return "line";
  if (value === "위챗") return "wechat";

  return "other";
};

const MESSENGER_STYLES: Record<
  MessengerCode,
  { label: string; badgeClass: string }
> = {
  kakaotalk: {
    label: "카카오톡",
    // Warning/Warning-40
    badgeClass: "bg-warning-40",
  },
  instagram: {
    label: "인스타그램",
    // Error/Error-20
    badgeClass: "bg-danger-20",
  },
  telegram: {
    label: "텔레그램",
    // Secondary/Secondary-40
    badgeClass: "bg-secondary-40",
  },
  line: {
    label: "라인",
    // Primary/Primary-60
    badgeClass: "bg-primary-60",
  },
  wechat: {
    label: "위챗",
    // Primary/Primary-80
    badgeClass: "bg-primary-80",
  },
  other: {
    label: "기타",
    badgeClass: "bg-neutral-60",
  },
};

export default function MessengerBadge({
  messenger,
  className = "",
}: MessengerBadgeProps) {
  const code = normalizeMessenger(messenger);
  const { label, badgeClass } = MESSENGER_STYLES[code];

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-[30px] text-white text-[12px] leading-[14px] font-medium opacity-80 ${badgeClass} ${className}`}
    >
      {label}
    </span>
  );
}


