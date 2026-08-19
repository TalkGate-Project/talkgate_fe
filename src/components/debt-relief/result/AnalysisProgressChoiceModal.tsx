"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelfProceed: () => void;
  onShare: () => void;
  submitting?: boolean;
};

export default function AnalysisProgressChoiceModal({ open, onClose, onSelfProceed, onShare, submitting = false }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-6">
      <section role="dialog" aria-modal="true" aria-labelledby="progress-choice-title" className="w-full max-w-[420px] rounded-[14px] border border-neutral-30 bg-card p-6 shadow-xl">
        <h2 id="progress-choice-title" className="text-[18px] font-semibold text-foreground">진행 방법을 선택해 주세요</h2>
        <p className="mt-2 text-[14px] leading-5 text-neutral-60">직접 절차를 진행하거나 분석 결과를 공유해 검토를 요청할 수 있습니다.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onShare} disabled={submitting} className="h-10 rounded-[6px] border border-neutral-30 bg-card text-[14px] font-semibold text-foreground hover:bg-neutral-10 disabled:opacity-50">공유하기</button>
          <button type="button" onClick={onSelfProceed} disabled={submitting} className="h-10 rounded-[6px] bg-neutral-90 text-[14px] font-semibold text-neutral-20 hover:opacity-90 disabled:opacity-50">자체진행</button>
        </div>
        <button type="button" onClick={onClose} disabled={submitting} className="mt-3 h-9 w-full text-[13px] text-neutral-60 hover:text-foreground disabled:opacity-50">취소</button>
      </section>
    </div>
  );
}
