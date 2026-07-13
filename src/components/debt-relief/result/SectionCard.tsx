import type { ReactNode } from "react";

// 결과 상세의 각 섹션을 감싸는 흰색 카드.
// 전역 헤더(54) + 서브헤더(48) + 상단 여백(36) = 138px 에 가리지 않도록 scroll-mt 부여.
export default function SectionCard({
  id,
  title,
  action,
  children,
  className = "",
}: {
  id: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-[138px] surface md:rounded-[14px] px-5 md:px-8 py-6 md:py-7 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
