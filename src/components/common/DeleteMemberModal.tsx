"use client";

import { useState } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  affiliation: string;
  avatar: string;
  hasSubordinates: boolean; // 하위 조직/구성원 존재 여부
}

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  member: Member | null;
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
    if (!member.hasSubordinates) {
      onConfirm();
      handleClose();
    }
  };

  if (!isOpen || !member) return null;

  const canDelete = !member.hasSubordinates;

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
            {member.hasSubordinates ? (
              <div className="mb-4 p-3 bg-[#FFF5F5] border border-[#FFE8E8] rounded-[5px]">
                <div className="text-[#FF4444] text-[16px] font-semibold mb-1">
                  하위 조직 및 구성원이 존재합니다.
                </div>
                <div className="text-[12px] text-[#808080]">
                  하위 조직이나 구성원이 있는 멤버는 삭제할 수 없습니다.
                </div>
              </div>
            ) : (
              <div className="text-[#D83232] text-[18px] font-semibold mb-4">
                정말로 멤버를 삭제하시겠습니까?
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Left div - Profile thumbnail */}
              <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center text-white font-semibold text-[18px]">
                {member.avatar}
              </div>
              
              {/* Right div - Name, email, tags */}
              <div className="flex flex-col gap-2">
                <div className="text-[16px] font-semibold text-[#000000]">
                  {member.name}
                </div>
                <div className="text-[14px] text-[#808080]">
                  {member.email}
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-[#E8E8E8] text-[#252525] text-[12px] rounded">
                    {member.role}
                  </span>
                  <span className="px-2 py-1 bg-[#E8E8E8] text-[#252525] text-[12px] rounded">
                    {member.affiliation}
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
