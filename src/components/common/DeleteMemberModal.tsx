"use client";

import type { MemberListItem } from "@/types/members";

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
  const isLeader = member.role === "leader";
  const isSubAdmin = member.role === "subAdmin";
  const hasSubordinates = isLeader || isSubAdmin; // 팀장이나 부관리자는 하위 구성원이 있다고 가정
  const canDelete = !hasSubordinates; // 하위 구성원이 있으면 삭제 불가

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-[440px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Header */}
          <div className="text-[18px] leading-[21px] font-semibold text-[#000000] mb-6">
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
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          {/* Warning Message */}
          <div className="text-center mb-6">
            {hasSubordinates ? (
              <div className="text-[#FF4444] text-[16px] leading-[21px] font-semibold">
                하위 조직 및 구성원이 존재합니다.
              </div>
            ) : (
              <div className="text-[#D83232] text-[18px] leading-[21px] font-semibold">
                정말로 멤버를 삭제하시겠습니까?
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="bg-[#F8F8F8] rounded-[5px] py-3 px-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Left div - Profile thumbnail */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-[18px] leading-[21px] ${
                hasSubordinates ? "bg-[#4CAF50]" : "bg-[#808080]"
              }`}>
                {avatar}
              </div>

              {/* Right div - Name, email, tags */}
              <div className="flex flex-col gap-1">
                <div className="text-[16px] leading-[19px] font-semibold text-[#000000] tracking-[0.2px]">
                  {member.name}
                </div>
                <div className="text-[14px] leading-5 font-medium text-[#808080]">
                  {member.email || `ID: ${member.userId}`}
                </div>
                <div className="flex gap-2 mt-1">
                  <span className={`px-3 py-1 text-[12px] leading-[14px] font-medium rounded-[30px] opacity-80 ${
                    hasSubordinates 
                      ? "bg-[#D6FAE8] text-[#00B55B]" 
                      : "bg-[#E2E2E2] text-[#595959]"
                  }`}>
                    {roleLabel}
                  </span>
                  <span className="px-3 py-1 bg-[#D3E1FE] text-[#4D82F3] text-[12px] leading-[14px] font-medium rounded-[30px] opacity-80">
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
              className="px-3 h-[34px] bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] leading-[17px] font-semibold text-[#000000] tracking-[-0.02em] hover:bg-gray-50 flex items-center justify-center"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete}
              className={`px-3 h-[34px] rounded-[5px] text-[14px] leading-[17px] font-semibold tracking-[-0.02em] transition-colors flex items-center justify-center ${
                canDelete
                  ? "bg-[#252525] text-[#EDEDED] hover:bg-[#333333]"
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
