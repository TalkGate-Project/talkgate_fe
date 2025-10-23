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
    <section className={`surface rounded-[16px] elevation-1 flex flex-col h-full w-full ${className ?? ""}`} style={style}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 pt-5">
          {typeof title === "string" ? (
            <h2 className="typo-title-2">{title}</h2>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      <div className={`${bodyClassName ?? (title ? "px-6 pb-6 pt-4" : "p-6")} grow`}>{children}</div>
    </section>
  );
}


