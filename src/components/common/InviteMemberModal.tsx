"use client";

import { useState } from "react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: "subAdmin" | "member") => void;
}

export default function InviteMemberModal({ 
  isOpen, 
  onClose, 
  onInvite 
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"subAdmin" | "member">("member");

  const handleInvite = () => {
    if (email.trim()) {
      onInvite(email.trim(), role);
      handleClose();
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("member");
    onClose();
  };

  if (!isOpen) return null;

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
            멤버 초대
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-[14px] font-medium text-[#252525] mb-2">
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="초대할 멤버의 이메일을 입력하세요"
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525]"
            />
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-[14px] font-medium text-[#252525] mb-2">
              역할
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "subAdmin" | "member")}
                className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525] appearance-none"
              >
                <option value="member">멤버</option>
                <option value="subAdmin">부관리자</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#B0B0B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
              onClick={handleInvite}
              disabled={!email.trim()}
              className={`px-4 py-2 rounded-[5px] text-[14px] font-semibold ${
                email.trim()
                  ? "bg-[#252525] text-[#D0D0D0] hover:bg-[#333333]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              초대 보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
