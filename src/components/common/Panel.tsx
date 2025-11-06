import { ReactNode, CSSProperties } from "react";

type PanelProps = {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  bodyClassName?: string;
};

export default function Panel({ title, action, className, children, style, bodyClassName }: PanelProps) {
  return (
    <section className={`surface rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] flex flex-col h-full w-full ${className ?? ""}`} style={style}>
      {(title || action) && (
        <div className="flex items-center justify-between px-7 pt-7 pb-5">
          {typeof title === "string" ? (
            <h2 className="typo-title-2">{title}</h2>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      <div className={`${bodyClassName ?? (title ? "px-7 pb-7 pt-4" : "p-7")} grow`}>{children}</div>
    </section>
  );
}


