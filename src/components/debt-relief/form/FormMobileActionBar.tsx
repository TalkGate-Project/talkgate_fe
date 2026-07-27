type Props = {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
};

// 데스크톱은 카드 내부 정적 위치에 이전/다음 버튼이 있지만, 모바일은 화면 최하단 fixed.
// Figma: 이전/다음 모두 72×34, radius 5 — 우측 정렬 (풀폭 flex-1 아님).
export default function FormMobileActionBar({
  isFirst,
  isLast,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 surface border-t border-neutral-20 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2">
      {!isFirst && (
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer inline-flex items-center justify-center w-[72px] h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10"
        >
          이전
        </button>
      )}
      {!isLast && (
        <button
          type="button"
          onClick={onNext}
          className="cursor-pointer inline-flex items-center justify-center w-[72px] h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] hover:opacity-90"
        >
          다음
        </button>
      )}
    </div>
  );
}
