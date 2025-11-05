"use client";

import { useState } from "react";

interface ServiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName?: string;
}

export default function ServiceDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  serviceName = "거래소 텔레마케팅 관리" 
}: ServiceDeleteModalProps) {
  const [inputValue, setInputValue] = useState(serviceName);
  const [isConfirmed, setIsConfirmed] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsConfirmed(value === serviceName);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setInputValue("");
    setIsConfirmed(false);
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
      <div className="relative w-[848px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
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
        <div className="p-8 h-full flex flex-col">
          {/* Header */}
          <div className="text-[#D83232] text-[18px] font-semibold mb-8">
            프로젝트 삭제확인
          </div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 flex items-center justify-center border-4 border-[#D83232] rounded-full">
              <span className="text-[#D83232] text-[24px] font-bold">!</span>
            </div>
          </div>

          {/* Main Warning */}
          <div className="text-center mb-8">
            <div className="text-[#D83232] text-[18px] font-semibold mb-2">
              정말로 프로젝트를 삭제하시겠습니까?
            </div>
            <div className="text-[#000000] text-[14px] font-medium">
              이 작업은 되돌릴 수 없으며, 다음 데이터가 영구적으로 삭제됩니다
            </div>
          </div>

          {/* Data to be Deleted List */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[#000000] text-[14px] font-medium leading-6">
              • 모든 상담 기록 및 메시지<br/>
              • 고객 정보 및 상담 내역<br/>
              • 멤버 및 팀 설정<br/>
              • 채널 설정 및 연동 정보<br/>
              • 통계 데이터 및 보고서
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[#000000] text-[14px] font-medium mb-3">
              프로젝트 삭제를 확인하려면 아래에 이름 "{serviceName}"을 정확히 입력하세요.
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={serviceName}
              className="w-full px-3 py-2 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-medium text-[#808080] focus:outline-none focus:border-[#D83232]"
            />
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#E2E2E2] mb-6"></div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className={`px-3 py-1.5 rounded-[5px] text-[14px] font-semibold ${
                isConfirmed
                  ? "bg-[#252525] text-[#D0D0D0] hover:bg-[#333333]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              프로젝트 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
