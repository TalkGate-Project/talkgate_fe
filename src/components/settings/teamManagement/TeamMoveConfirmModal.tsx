"use client";

import { TeamMember } from "@/types/teams";
import BaseModal from "@/components/common/BaseModal";

interface TeamMoveConfirmModalProps {
  source: TeamMember;
  currentParent: TeamMember | undefined;
  target: TeamMember;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TeamMoveConfirmModal({
  source,
  currentParent,
  target,
  isPending,
  onConfirm,
  onCancel,
}: TeamMoveConfirmModalProps) {
  const currentLocationLabel = currentParent
    ? `${currentParent.name} (${currentParent.department})`
    : "루트";
  const targetLocationLabel = `${target.name} (${target.department})`;
  const handleClose = () => {
    if (!isPending) onCancel();
  };

  return (
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={false}
      zIndexClassName="z-50"
      overlayClassName="bg-black/40"
      ariaLabel="조직 이동 확인"
      disableAutoContainerSizing
      containerClassName="bg-card rounded-[12px] md:rounded-[16px] shadow-xl dark:shadow-none w-full max-w-[500px] p-4 md:p-6"
    >
        <h2 className="text-[16px] md:text-[18px] font-bold text-foreground mb-4">조직 이동 확인</h2>
        <div className="rounded-[12px] bg-neutral-10 px-3 md:px-4 py-4 md:py-5 mb-4 md:mb-5 flex flex-col gap-3 md:gap-4">
          <div className="min-w-0">
            <span className="block text-[12px] font-medium text-neutral-60 mb-1">이동할 항목</span>
            <span
              className="block w-full min-w-0 px-3 py-1 rounded-[6px] bg-card text-[13px] md:text-[14px] font-semibold text-foreground"
              title={source.name}
            >
              <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {source.name}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <span className="block text-[12px] font-medium text-neutral-60 mb-1">현재 위치</span>
              <span
                className="block w-full min-w-0 px-2 md:px-3 py-1 rounded-[6px] bg-warning-10 text-[12px] md:text-[14px] font-semibold text-warning-60"
                title={currentLocationLabel}
              >
                <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {currentLocationLabel}
                </span>
              </span>
            </div>
            <svg
              width="20"
              height="20"
              className="md:w-6 md:h-6 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="var(--neutral-50)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="block text-[12px] font-medium text-neutral-60 mb-1">이동할 위치</span>
              <span
                className="block w-full min-w-0 px-2 md:px-3 py-1 rounded-[6px] bg-primary-10 text-[12px] md:text-[14px] font-semibold text-primary-80"
                title={targetLocationLabel}
              >
                <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {targetLocationLabel}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 md:px-4 py-2 rounded-[5px] border border-border text-[13px] md:text-[14px] font-semibold text-foreground"
            disabled={isPending}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 md:px-4 py-2 rounded-[5px] bg-neutral-90 text-neutral-0 text-[13px] md:text-[14px] font-semibold"
            disabled={isPending}
          >
            {isPending ? "이동 중..." : "조직이동"}
          </button>
        </div>
    </BaseModal>
  );
}
