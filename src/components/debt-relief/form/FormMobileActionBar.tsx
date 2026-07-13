type Props = {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  /** 생성 플로우에서 현재 스텝 필수값 미충족 시 true */
  nextDisabled?: boolean;
};

// 데스크톱은 카드 내부 정적 위치에 이전/다음 버튼이 있지만, 모바일은 화면 최하단
// position: fixed 풀폭 바로 문서 흐름 자체가 다르다 — 같은 마크업을 CSS로 재사용하지 않고 분리.
export default function FormMobileActionBar({
  isFirst,
  isLast,
  onBack,
  onNext,
  nextDisabled = false,
}: Props) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 surface border-t border-neutral-20 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-2">
      {!isFirst && (
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer flex-1 h-[48px] rounded-[8px] border border-neutral-30 text-[14px] font-semibold text-foreground hover:bg-neutral-10"
        >
          이전
        </button>
      )}
      {!isLast && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="cursor-pointer disabled:cursor-not-allowed flex-1 h-[48px] rounded-[8px] bg-neutral-90 text-neutral-0 text-[14px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          다음
        </button>
      )}
    </div>
  );
}
