import type { ReactNode } from "react";

type JoinedEdge = "start" | "end";

// 결과 상세의 각 섹션을 감싸는 흰색 카드.
// 전역 헤더(54) + 앵커 내비(48) = 102px. 데스크톱은 상단 여백(36)까지 포함해 scroll-mt 138px.
export default function SectionCard({
  id,
  title,
  action,
  children,
  className = "",
  compactTop = false,
  topDivider = false,
  joined,
  joinBottomDivider = false,
}: {
  id: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  // 모바일 상단 패딩을 24px 대신 12px로 좁힌다 (overview 카드처럼 헤더 바로 아래 붙는 섹션용).
  compactTop?: boolean;
  // 모바일에서 카드 간 배경이 이어져 붙어도(gap-0) 영역 구분이 되도록 상단에 풀폭 구분선을 그린다.
  // border는 padding 바깥(패딩 박스 경계)에 그려지므로 좌우 패딩과 무관하게 항상 전체 폭으로 표시된다.
  // 데스크톱은 카드 간 gap·shadow로 이미 구분되므로 적용하지 않는다.
  topDivider?: boolean;
  // 인접 카드와 하나의 섹션처럼 붙일 때: start=상단만 round, end=하단만 round.
  // 그림자는 감싸는 래퍼에 두고, joined 카드 자체는 shadow를 끈다.
  joined?: JoinedEdge;
  // joined="start"에서만 의미 있음: 하단에 경계 구분선을 그릴지 여부.
  // 마지막 자식이 이미 자체 테두리로 경계를 표시하는 콘텐츠(예: 전달사항 카드)라면 겹쳐 보이므로
  // 그 콘텐츠가 없을 때만 켜서, overview·다음 joined 카드 사이가 완전히 비지 않게 한다.
  joinBottomDivider?: boolean;
}) {
  const isJoined = joined === "start" || joined === "end";
  const radiusClass = isJoined
    ? joined === "start"
      ? "md:rounded-t-[14px] md:rounded-b-none"
      : "md:rounded-b-[14px] md:rounded-t-none"
    : "md:rounded-[14px]";
  const shadowClass = isJoined
    ? "shadow-none"
    : "shadow-none md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:md:shadow-none";
  const joinBorderClass =
    joined === "start" && joinBottomDivider
      ? "border-b border-neutral-30"
      : topDivider
        ? "border-t border-neutral-30 md:border-t-0"
        : "";
  const paddingClass = isJoined
    ? joined === "start"
      ? "pt-3 pb-3 md:pt-7 md:pb-4"
      : compactTop
        ? "pt-6 pb-6 md:py-7"
        : "py-6 md:py-7"
    : `${compactTop ? "pt-3 pb-6" : "py-6"} md:py-7`;

  return (
    <section
      id={id}
      className={`scroll-mt-[102px] md:scroll-mt-[138px] surface ${radiusClass} px-6 md:px-8 ${paddingClass} ${shadowClass} ${joinBorderClass} ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-neutral-30">
          <h2 className="text-[18px] font-bold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
