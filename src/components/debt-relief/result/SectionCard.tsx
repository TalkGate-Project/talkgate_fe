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
  mobileCompactBottom = false,
  compactMobileTitle = false,
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
  // 모바일 전용: 다음 섹션과 풀폭 구분선 없이 바로 이어질 때 하단 패딩을 pb-2로 줄인다.
  // (예: AI 분석 추천 → 절차별 성공 가능성). md+는 기존 md:py-7 또는 className 오버라이드를 유지한다.
  // joined 카드에는 적용하지 않는다(변호사 공유 건의 overview·scores 결합 레이아웃과 분리).
  mobileCompactBottom?: boolean;
  // 모바일 피그마의 16px/19px semibold 섹션 타이틀과 16px 하단 간격을 사용한다.
  compactMobileTitle?: boolean;
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

  // joined / 일반 카드 패딩은 서로 다른 레이아웃이므로 분기 유지.
  // mobileCompactBottom은 비-joined + compactTop일 때만 모바일 pb를 줄인다.
  let paddingClass: string;
  if (isJoined) {
    paddingClass =
      joined === "start"
        ? "pt-3 pb-3 md:pt-7 md:pb-4"
        : compactTop
          ? "pt-6 pb-6 md:py-7"
          : "py-6 md:py-7";
  } else if (compactTop && mobileCompactBottom) {
    paddingClass = "pt-3 pb-2 md:py-7";
  } else if (compactTop) {
    paddingClass = "pt-3 pb-6 md:py-7";
  } else {
    paddingClass = "py-6 md:py-7";
  }

  return (
    <section
      id={id}
      className={`scroll-mt-[102px] md:scroll-mt-[138px] surface ${radiusClass} px-6 md:px-8 ${paddingClass} ${shadowClass} ${joinBorderClass} ${className}`}
    >
      {title && (
        <div
          className={`flex items-center justify-between border-b border-neutral-30 pb-3 ${
            compactMobileTitle ? "mb-4 md:mb-6" : "mb-6"
          }`}
        >
          <h2
            className={
              compactMobileTitle
                ? "text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground md:text-[18px] md:font-bold md:leading-normal md:tracking-normal"
                : "text-[18px] font-bold text-foreground"
            }
          >
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
