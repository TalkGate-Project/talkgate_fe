"use client";

import BaseModal from "@/components/common/BaseModal";

type IncompleteStep = { index: number; label: string; missingFields: string[] };

export default function AnalysisRequiredFieldsModal({ open, steps, unchanged, onClose, onSelectStep }: { open: boolean; steps: IncompleteStep[]; unchanged: boolean; onClose: () => void; onSelectStep: (index: number) => void }) {
  if (!open) return null;
  return <BaseModal onClose={onClose} overlayClassName="bg-black/35 dark:bg-[#000000CC]" containerClassName="w-[calc(100vw-2rem)] sm:w-[440px] sm:min-w-[440px] max-w-[440px] rounded-[14px] bg-card shadow-[0_18px_50px_rgba(0,0,0,0.22)] dark:shadow-none" ariaLabel="분석하기 필수 정보 안내">
    <div className="relative px-7 pt-6 pb-[30px]">
      <div className="flex items-start justify-between">
        <h2 className="text-[18px] font-semibold text-neutral-90">분석하기</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
      </div>
      <div className="mt-6 flex justify-center text-secondary-80 dark:text-secondary-20"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden><circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="4"/><path d="M20 11v11M20 29h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg></div>
      <p className="mt-5 text-center text-[18px] font-semibold leading-[21px] text-secondary-80 dark:text-secondary-20">{unchanged ? "변경된 내용이 없습니다." : "필수 정보가 입력되지 않았습니다."}</p>
      <p className="mt-3 text-center text-[14px] font-medium leading-[20px] text-neutral-90">{unchanged ? "정보를 수정한 뒤 다시 분석해주세요." : "다음 단계의 필수 정보를 입력해주세요."}</p>
      {steps.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {steps.map((step) => (
            <button
              key={step.index}
              type="button"
              onClick={() => onSelectStep(step.index)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-neutral-30 bg-card px-4 py-2.5 text-left hover:border-secondary-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-neutral-90">{step.label}</span>
                <span className="truncate text-[12px] text-neutral-60">{step.missingFields.join(", ")}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-neutral-50"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
      )}
    </div>
    <div className="h-px bg-neutral-30" />
    <div className="flex justify-end px-7 py-4"><button type="button" onClick={onClose} className="flex h-[34px] min-w-[72px] cursor-pointer items-center justify-center rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold text-neutral-20">확인</button></div>
  </BaseModal>;
}
