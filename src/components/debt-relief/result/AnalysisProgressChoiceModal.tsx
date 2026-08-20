"use client";

import BaseModal from "@/components/common/BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelfProceed: () => void;
  onShare: () => void;
  submitting?: boolean;
};

export default function AnalysisProgressChoiceModal({ open, onClose, onSelfProceed, onShare, submitting = false }: Props) {
  if (!open) return null;

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    // 요청 실패 피드백은 공용 오류 모달(z-280)이 이 선택 화면 위에 표시한다.
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={!submitting}
      zIndexClassName="z-[270]"
      overlayClassName="bg-black/30 dark:bg-black/80"
      ariaLabel="진행방법 선택"
      positionerClassName="min-h-full flex items-center justify-center px-4"
      disableAutoContainerSizing
      containerClassName="relative max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-[14px] bg-card px-4 py-6 shadow-[0_13px_61px_rgba(169,169,169,0.366)] outline-none dark:shadow-[0_13px_61px_rgba(0,0,0,0.55)] md:h-[295px] md:px-7"
    >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="진행방법 선택 닫기"
          className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-50 transition-colors hover:bg-neutral-10 hover:text-neutral-70 disabled:cursor-not-allowed disabled:opacity-50 md:right-5 md:top-5"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="progress-choice-title" className="pr-8 text-[18px] font-semibold leading-[21px] text-foreground">
          진행방법 선택
        </h2>
        <p id="progress-choice-description" className="mt-[27px] text-center text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
          상담 내용의 진행 방식을 선택해주세요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onSelfProceed}
            disabled={submitting}
            className="group mx-auto h-[155px] w-full cursor-pointer rounded-[14px] p-5 text-left transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary-40)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:w-[186px]"
            style={{ background: "var(--progress-choice-self-gradient)" }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-card text-secondary-40 shadow-[0_3px_4px_rgba(9,30,66,0.1)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2m-4-1v8M9 8l3 3 3-3M4 13h2.586a1 1 0 0 1 .707.293l2.414 2.414a1 1 0 0 0 .707.293h3.172a1 1 0 0 0 .707-.293l2.414-2.414a1 1 0 0 1 .707-.293H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="mt-3 block text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-secondary-40">자체진행</span>
            <span className="mt-2 block text-[14px] font-normal leading-[17px] tracking-[0.2px] text-neutral-60">검토중을 건너뛰고 계약<br />대기중으로 바로 이동</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            disabled={submitting}
            className="group mx-auto h-[155px] w-full cursor-pointer rounded-[14px] p-5 text-left transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger-40)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:w-[186px]"
            style={{ background: "var(--progress-choice-share-gradient)" }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-card text-danger-40 shadow-[0_3px_4px_rgba(9,30,66,0.1)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M16.04 2c.226.101.393.234.583.434l5.155 5.433c.331.349.272.868-.042 1.202l-5.147 5.117c-.245.261-.593.311-.891.18-.281-.124-.481-.429-.482-.787l-.003-2.611c-2.027.031-3.594 1.258-4.702 2.926-.256.384-.472.768-.702 1.169-.178.31-.485.493-.82.437-.298-.049-.585-.276-.66-.628-.616-2.894.095-5.501 2.168-7.526 1.211-1.308 2.892-1.812 4.587-1.955l-.002-2.479c0-.46.269-.803.678-.912h.28Zm-4.186 8.256c1.31-.81 2.78-1.131 4.264-.913.412.06.696.414.696.849l.012 1.336 3.24-3.083-3.369-3.531-.015 1.254c.019.548-.389.909-.89.901-.858-.013-1.685.116-2.491.413-.416.152-.808.323-1.162.604-1.363 1.085-2.114 2.212-2.33 3.991.628-.738 1.252-1.332 2.045-1.821Z" fill="currentColor" />
                <path d="M10.857 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4.857" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="mt-3 block text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-danger-40">공유하기</span>
            <span className="mt-2 block text-[14px] font-normal leading-[17px] tracking-[0.2px] text-neutral-60">법무법인으로 공유하는<br />기존 프로세스</span>
          </button>
        </div>
    </BaseModal>
  );
}
