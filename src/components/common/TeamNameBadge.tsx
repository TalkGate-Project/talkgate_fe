import type { CSSProperties } from "react";

type Props = {
  label: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export default function TeamNameBadge({ label, className = "", style, title }: Props) {
  return (
    <div
      className={[
        "inline-flex items-center justify-center",
        "px-3",
        "h-[22px]",
        "rounded-[30px]",
        "bg-secondary-10",
        className,
      ].join(" ")}
      style={style}
      title={title ?? label}
    >
      <span className="text-[12px] font-medium text-secondary-40 leading-[22px] whitespace-nowrap truncate">
        {label}
      </span>
    </div>
  );
}

