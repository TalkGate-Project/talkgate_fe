type BadgeVariant = "primary" | "secondary" | "neutral";

type RoleBadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const BADGE_STYLES: Record<BadgeVariant, { background: string; color: string }> = {
  primary: { background: "#D6FAE8", color: "#00B55B" },
  secondary: { background: "#D3E1FE", color: "#4D82F3" },
  neutral: { background: "#E2E2E2", color: "#595959" },
};

export default function RoleBadge({ label, variant = "secondary" }: RoleBadgeProps) {
  const tone = BADGE_STYLES[variant];
  return (
    <span
      className="px-3 py-1 rounded-[30px] text-[12px] font-medium leading-[1]"
      style={{ background: tone.background, color: tone.color, opacity: 0.8 }}
    >
      {label}
    </span>
  );
}

