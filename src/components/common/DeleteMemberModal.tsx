"use client";

import type { MemberListItem } from "@/types/members";

const ROLE_LABELS: Record<string, string> = {
  admin: "총관리자",
  subAdmin: "부관리자",
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
  member
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
  const roleLabel = member.role ? (ROLE_LABELS[member.role] || member.role) : "-";
  const canDelete = true; // API에서 삭제 가능 여부를 받을 수 있다면 수정

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-[400px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center"
        >
          <svg className="w-4 h-4 border-2 border-[#B0B0B0]" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-[18px] font-semibold text-[#252525] mb-6">
            멤버 삭제
          </div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 flex items-center justify-center border-4 border-[#D83232] rounded-full">
              <span className="text-[#D83232] text-[24px] font-bold">!</span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center mb-6">
            <div className="text-[#D83232] text-[18px] font-semibold mb-4">
              정말로 멤버를 삭제하시겠습니까?
            </div>
            <div className="text-[14px] text-[#808080]">
              삭제된 멤버는 복구할 수 없습니다.
            </div>
          </div>

          {/* Member Info */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Left div - Profile thumbnail */}
              <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center text-white font-semibold text-[18px]">
                {avatar}
              </div>
              
              {/* Right div - Name, email, tags */}
              <div className="flex flex-col gap-2">
                <div className="text-[16px] font-semibold text-[#000000]">
                  {member.name}
                </div>
                <div className="text-[14px] text-[#808080]">
                  {member.email || `ID: ${member.userId}`}
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-[#E8E8E8] text-[#252525] text-[12px] rounded">
                    {roleLabel}
                  </span>
                  <span className="px-2 py-1 bg-[#E8E8E8] text-[#252525] text-[12px] rounded">
                    {member.teamName || "소속없음"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete}
              className={`px-4 py-2 rounded-[5px] text-[14px] font-semibold transition-colors ${
                canDelete
                  ? "bg-[#252525] text-[#D0D0D0] hover:bg-[#333333]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              멤버삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
