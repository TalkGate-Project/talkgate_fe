"use client";

import BaseModal from "@/components/common/BaseModal";
import type { TeamMember } from "@/types/teams";

type Props = {
  member: TeamMember;
  currentLeader: TeamMember;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function buildMemberLabel(member: TeamMember) {
  return member.department ? `${member.name} (${member.department})` : member.name;
}

function MemberChangeField({
  label,
  memberLabel,
  isChanged,
}: {
  label: string;
  memberLabel: string;
  isChanged?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-[14px] font-medium tracking-[0.2px] text-neutral-60">{label}</span>
      <span
        className={`mt-2 flex h-[34px] items-center rounded-[5px] border border-border px-3 text-[14px] font-medium ${
          isChanged
            ? "bg-primary-10 text-primary-80"
            : "bg-card text-foreground"
        }`}
        title={memberLabel}
      >
        <span className="truncate">{memberLabel}</span>
      </span>
    </div>
  );
}

export default function TeamLeaderChangeConfirmModal({
  member,
  currentLeader,
  isPending,
  onConfirm,
  onCancel,
}: Props) {
  const memberLabel = buildMemberLabel(member);
  const currentLeaderLabel = buildMemberLabel(currentLeader);

  const handleClose = () => {
    if (!isPending) onCancel();
  };

  return (
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={false}
      zIndexClassName="z-50"
      overlayClassName="bg-black/40"
      ariaLabel="팀원 이동 확인"
      disableAutoContainerSizing
      containerClassName="w-[calc(100%-2rem)] max-w-[440px] overflow-hidden rounded-[14px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.366)] drop-shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
    >
      <div className="px-7 pb-[30px] pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-foreground">팀원 이동 확인</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="팀원 이동 모달 닫기"
            className="flex h-6 w-6 cursor-pointer items-center justify-center text-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="relative mt-[26px] rounded-[5px] bg-neutral-10 px-6 py-5">
          <div className="grid grid-cols-2 gap-x-16 gap-y-5">
            <MemberChangeField label="현재 팀원" memberLabel={memberLabel} />
            <MemberChangeField label="팀장 변경" memberLabel={memberLabel} isChanged />
            <MemberChangeField label="현재 팀장" memberLabel={currentLeaderLabel} isChanged />
            <MemberChangeField label="팀원 변경" memberLabel={currentLeaderLabel} />
          </div>
          <svg
            className="absolute left-1/2 top-[80px] -translate-x-1/2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M14 19L21 12L14 5M21 12L3 12" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="h-px bg-border" />
      <div className="flex justify-end gap-3 px-7 py-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex h-[34px] cursor-pointer items-center justify-center rounded-[5px] border border-border px-3 text-[14px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="flex h-[34px] w-[80px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold text-neutral-20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "이동 중..." : "팀원이동"}
        </button>
      </div>
    </BaseModal>
  );
}
