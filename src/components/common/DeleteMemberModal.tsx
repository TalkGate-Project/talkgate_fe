"use client";

import type { MemberListItem } from "@/types/members";
import BaseModal from "@/components/common/BaseModal";

const ROLE_LABELS: Record<string, string> = {
  admin: "총관리자",
  subAdmin: "부관리자",
  leader: "팀장",
  member: "멤버",
};

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  member: MemberListItem | null;
}

export default function DeleteMemberModal({
  isOpen,
  onClose,
  onConfirm,
  member,
}: DeleteMemberModalProps) {
  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (!member) return;
    onConfirm();
    handleClose();
  };

  if (!isOpen || !member) return null;

  const avatar = member.name ? member.name[0] : "?";
  const roleLabel = member.role ? ROLE_LABELS[member.role] || member.role : "-";

  return (
    <BaseModal
      onClose={handleClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      ariaLabel="멤버 삭제"
      disableAutoContainerSizing
      containerClassName="relative w-[440px] bg-white dark:bg-neutral-10 rounded-[14px]"
    >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center text-neutral-50 dark:text-neutral-50 cursor-pointer"
          aria-label="닫기"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Header */}
          <div className="text-[18px] leading-[21px] font-semibold text-ink dark:text-neutral-90 mb-6">
            멤버 삭제
          </div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.9986 15V18.3333M19.9986 25H20.0153M8.45159 31.6667H31.5456C34.1116 31.6667 35.7153 28.8889 34.4323 26.6667L22.8853 6.66667C21.6023 4.44444 18.3948 4.44444 17.1118 6.66667L5.56484 26.6667C4.28184 28.8889 5.88559 31.6667 8.45159 31.6667Z"
                stroke="#D83232"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Warning Message */}
          <div className="text-center mb-6">
            <div className="text-danger-40 text-[18px] leading-[21px] font-semibold">
              정말로 멤버를 삭제하시겠습니까?
            </div>
          </div>

          {/* Member Info */}
          <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] py-3 px-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Left div - Profile thumbnail */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-[18px] leading-[21px] bg-neutral-60 dark:bg-neutral-40">
                {avatar}
              </div>

              {/* Right div - Name, email, tags */}
              <div className="flex flex-col gap-1">
                <div className="text-[16px] leading-[19px] font-semibold text-ink dark:text-neutral-90 tracking-[0.2px]">
                  {member.name}
                </div>
                <div className="text-[14px] leading-5 font-medium text-neutral-60 dark:text-neutral-50">
                  {member.email || `ID: ${member.userId}`}
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="px-3 py-1 text-[12px] leading-[14px] font-medium rounded-[30px] opacity-80 bg-neutral-30 text-neutral-70 dark:bg-neutral-30 dark:text-neutral-50">
                    {roleLabel}
                  </span>
                  <span className="px-3 py-1 bg-secondary-10 text-secondary-40 dark:bg-secondary-80/30 dark:text-secondary-20 text-[12px] leading-[14px] font-medium rounded-[30px] opacity-80">
                    {member.teamName || "소속없음"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 h-[34px] bg-white dark:bg-neutral-20 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] leading-[17px] font-semibold text-ink dark:text-neutral-90 tracking-[-0.02em] hover:bg-neutral-10 dark:hover:bg-neutral-25 flex items-center justify-center cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 h-[34px] rounded-[5px] text-[14px] leading-[17px] font-semibold tracking-[-0.02em] transition-colors flex items-center justify-center cursor-pointer bg-neutral-90 text-neutral-20 dark:bg-neutral-80 dark:text-neutral-20 hover:bg-neutral-100 dark:hover:bg-neutral-70"
            >
              멤버삭제
            </button>
          </div>
        </div>
    </BaseModal>
  );
}
