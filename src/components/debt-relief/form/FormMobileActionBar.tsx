import FormStepNavButton from "./FormStepNavButton";

type Props = {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
};

// 데스크톱은 카드 내부 정적 위치에 이전/다음 버튼이 있지만, 모바일은 화면 최하단 fixed.
export default function FormMobileActionBar({
  isFirst,
  isLast,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 surface border-t border-neutral-20 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-center gap-2">
      <FormStepNavButton direction="prev" disabled={isFirst} onClick={onBack} />
      <FormStepNavButton direction="next" disabled={isLast} onClick={onNext} />
    </div>
  );
}
