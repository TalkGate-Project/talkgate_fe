export type AnchorSection = { id: string; label: string };

type Props = {
  sections: AnchorSection[];
  activeId: string;
  onNavigate: (id: string) => void;
};

// 전역 헤더(54px, fixed) 바로 아래에 고정되는 전체 폭 서브헤더.
// 페이지 콘텐츠 스크롤과 무관하게 항상 고정되도록 sticky가 아닌 fixed를 쓴다.
// (전역 헤더와 동일한 좌표계에 두어 body zoom과 무관하게 정렬됨)
export default function ResultAnchorNav({ sections, activeId, onNavigate }: Props) {
  return (
    <div className="fixed top-[54px] left-0 right-0 z-40 bg-card shadow-[0px_4px_8px_rgba(0,0,0,0.08)] dark:shadow-[0px_4px_8px_rgba(0,0,0,0.4)]">
      {/* 탭 바 자체는 풀폭. 첫/끝 탭 패딩만으로 화면 가장자리 여백을 맞춤 —
          바깥 컨테이너에 px를 또 주면 콘텐츠 카드와 탭 정렬이 어긋나고 이중 여백이 된다. */}
      <div className="mx-auto w-full max-w-[1324px] md:px-6 lg:px-0">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 md:px-0">
          {sections.map((section) => {
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                className={`cursor-pointer relative h-[48px] px-4 whitespace-nowrap text-[14px] transition-colors ${
                  isActive
                    ? "text-foreground font-bold"
                    : "text-neutral-60 font-medium hover:text-foreground"
                }`}
              >
                {section.label}
                {isActive && (
                  <span className="absolute left-4 right-4 bottom-0 h-[2px] rounded-full bg-primary-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
